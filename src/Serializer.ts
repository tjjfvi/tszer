import { Readable, Writable } from "stream";
import BufferList = require("bl");

export type WriteChunk = (chunk: Buffer) => Promise<void>;
export type SerializeFunc<T> = (value: T, writeChunk: WriteChunk) => Promise<void>
export type GetChunk = (length: number) => Promise<Buffer>;
export type DeserializeFunc<T> = (getChunk: GetChunk) => Promise<T>

export interface SerializerArgs<T> {
  serialize: SerializeFunc<T>,
  deserialize: DeserializeFunc<T>,
}

export type ConstLengthSerializeFunc<T> = (value: T, buffer: Buffer, offset: number) => void
export type ConstLengthDeserializeFunc<T> = (buffer: Buffer) => T | Promise<T>

export interface ConstLengthSerializerArgs<T> {
  length: number,
  serialize: ConstLengthSerializeFunc<T>,
  deserialize: ConstLengthDeserializeFunc<T>,
}

export interface MapArgs<T, U> {
  serialize: (value: U) => T | Promise<T>,
  deserialize: (value: T) => U | Promise<U>,
}

export class Serializer<T> {

  private _serialize: SerializeFunc<T>;
  private _deserialize: DeserializeFunc<T>;

  serialize(value: T, _?: undefined): Readable
  serialize(value: T, writeChunk: WriteChunk): Promise<void>
  serialize(value: T, writeChunk?: WriteChunk): Readable | Promise<void> {
    if (!writeChunk)
      return Serializer.serialize(this, value);
    return this._serialize(value, writeChunk);
  }

  deserialize(stream: Readable): Promise<T>
  deserialize(getChunk: GetChunk): Promise<T>
  deserialize(getChunk: Readable | GetChunk): Promise<T> {
    if (getChunk instanceof Readable)
      return Serializer.deserialize(this, getChunk);
    return this._deserialize(getChunk);
  }

  constructor(args: ConstLengthSerializerArgs<T>)
  constructor(args: SerializerArgs<T>)
  constructor(args: SerializerArgs<T> | ConstLengthSerializerArgs<T>) {
    if ("length" in args) {
      const { length } = args;
      this._serialize = async (value, writeChunk) => {
        const buffer = Buffer.alloc(length);
        args.serialize(value, buffer, 0);
        await writeChunk(buffer);
      };
      this._deserialize = async getChunk => {
        const chunk = await getChunk(length);
        return args.deserialize(chunk);
      }
    } else {
      this._serialize = args.serialize;
      this._deserialize = args.deserialize;
    }
  }

  map<U>({
    serialize,
    deserialize,
  }: MapArgs<T, U>) {
    return new Serializer<U>({
      serialize: async (value, writeChunk) => {
        const mappedValue = await serialize(value);
        return this._serialize(mappedValue, writeChunk);
      },
      deserialize: async getChunk => {
        const value = await this._deserialize(getChunk);
        return deserialize(value);
      },
    })
  }

  static serialize<T>(serializer: Serializer<T>, value: T): Readable {
    return Readable.from({
      [Symbol.asyncIterator]() {
        let resolveIterator: ((result: IteratorResult<Buffer, void>) => void) | null = null;
        let resolveSerializer: (() => void) | null = null;

        resolveSerializer = () => {
          serializer._serialize(value, writeChunk).then(() => {
            if (!resolveIterator) /* istanbul ignore next */
              throw new Error("Internal error in tszer");
            resolveIterator({ done: true, value: undefined })
          })
        }

        return {
          next() {
            return new Promise<IteratorResult<Buffer, void>>(r => {
              if (!resolveSerializer) /* istanbul ignore next */
                throw new Error("Internal error in tszer");
              resolveIterator = r;
              resolveSerializer();
            })
          }
        }

        function writeChunk(chunk: Buffer) {
          return new Promise<void>(r => {
            if (!resolveIterator) /* istanbul ignore next */
              throw new Error("Internal error in tszer");
            resolveIterator({ value: chunk, done: false });
            resolveSerializer = r
          });
        }
      }
    });
  }

  static async deserialize<T>(serializer: Serializer<T>, stream: Readable): Promise<T> {
    const bufferList = new BufferList();

    let onMoreData: (() => void) | null = null;
    let ended = false;
    let resume = () => { };
    let final = () => { };

    let writeStream = new Writable({
      write: (chunk, _, callback) => {
        bufferList.append(chunk);
        resume = callback;
        onMoreData?.();
      },
      final: (callback) => {
        final = callback;
        ended = true;
        onMoreData?.();
      },
    })

    stream.pipe(writeStream);

    let value = await serializer._deserialize(getChunk);
    if (onMoreData) /* istanbul ignore next */
      throw new Error("Internal error in tszer");
    return await new Promise((resolve, reject) => {
      onMoreData = () => {
        if (bufferList.length)
          return reject(new Error("Expected end of input"));
        onMoreData = null;
        writeStream.destroy();
        final();
        resolve(value);
      }
      if (ended) onMoreData();
      else resume();
    })

    function getChunk(size: number) {
      if (!size)
        return Promise.resolve(Buffer.alloc(0))
      if (onMoreData) /* istanbul ignore next */
        throw new Error("Internal error in tszer");
      return new Promise<Buffer>(resolve => {
        onMoreData = () => {
          if (bufferList.length < size)
            if (!ended)
              return resume();
            else
              throw new Error("Unexpected end of input");
          const chunk = bufferList.slice(0, size);
          bufferList.consume(size);
          onMoreData = null;
          resolve(chunk);
        }
        onMoreData();
      })
    }
  }

}