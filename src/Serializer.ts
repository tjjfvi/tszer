import { Readable } from "stream";
import { resolve } from "path";

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

export class Serializer<T> {

  serialize: SerializeFunc<T>;
  deserialize: DeserializeFunc<T>;

  constructor(args: ConstLengthSerializerArgs<T>)
  constructor(args: SerializerArgs<T>)
  constructor(args: SerializerArgs<T> | ConstLengthSerializerArgs<T>) {
    if ("length" in args) {
      const { length } = args;
      this.serialize = async (value, writeChunk) => {
        const buffer = Buffer.alloc(length);
        args.serialize(value, buffer, 0);
        await writeChunk(buffer);
      };
      this.deserialize = async getChunk => {
        const chunk = await getChunk(length);
        return args.deserialize(chunk);
      }
    } else {
      this.serialize = args.serialize;
      this.deserialize = args.deserialize;
    }
  }

  map<U>({
    serialize,
    deserialize,
  }: {
    serialize: (value: U) => T | Promise<T>,
    deserialize: (value: T) => U | Promise<U>,
  }) {
    return new Serializer<U>({
      serialize: async (value, writeChunk) => {
        const mappedValue = await serialize(value);
        return this.serialize(mappedValue, writeChunk);
      },
      deserialize: async getChunk => {
        const value = await this.deserialize(getChunk);
        return deserialize(value);
      },
    })
  }

  errorOnNull(message: string) {
    return this.map<NonNullable<T>>({
      serialize: v => v,
      deserialize: v => {
        if (v == null)
          throw new Error(message);
        return v as NonNullable<T>;
      }
    })
  }

  static serialize<T>(serializer: Serializer<T>, value: T): Readable {
    return Readable.from({
      [Symbol.asyncIterator]() {
        let resolveIterator: ((result: IteratorResult<Buffer, void>) => void) | null = null;
        let resolveSerializer: (() => void) | null = null;

        resolveSerializer = () => {
          serializer.serialize(value, writeChunk).then(() => {
            if (!resolveIterator)
              throw new Error("Internal error in tszer");
            resolveIterator({ done: true, value: undefined })
          })
        }

        return {
          next() {
            return new Promise<IteratorResult<Buffer, void>>(r => {
              if (!resolveSerializer)
                throw new Error("Internal error in tszer");
              resolveIterator = r;
              resolveSerializer();
            })
          }
        }

        function writeChunk(chunk: Buffer) {
          return new Promise<void>(r => {
            if (!resolveIterator)
              throw new Error("Internal error in tszer");
            resolveIterator({ value: chunk, done: false });
            resolveSerializer = r
          });
        }
      }
    });
  }

  static async deserialize<T>(serializer: Serializer<T>, stream: Readable) {
    let bufferStream = new Readable({
      read: () => { },
    });
    let onMoreData: (() => void) | null = null;

    stream
      .on("data", (chunk: Buffer) => {
        bufferStream.push(chunk);
        onMoreData?.();
      })
      .on("end", () => {
        bufferStream.push(null);
        onMoreData?.();
      })

    stream.pause();

    return await serializer.deserialize(getChunk);

    function getChunk(size: number) {
      if (onMoreData)
        throw new Error("Internal error in tszer");
      if (stream.isPaused())
        stream.resume();
      if (!size)
        return Promise.resolve(Buffer.alloc(0))
      return new Promise<Buffer>(resolve => {
        onMoreData = () => {
          const chunk = bufferStream.read(size);
          if (!chunk)
            return;
          if (chunk.length !== size)
            throw new Error("Unexpected end of input");
          onMoreData = null;
          stream.pause();
          resolve(chunk);
        }
        onMoreData();
      })
    }
  }

}