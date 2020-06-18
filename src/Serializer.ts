import { Readable } from "stream";

export type SerializeResult = AsyncGenerator<{ value: Buffer } | { gen: () => SerializeResult }, void, void>;

export type DeserializeResult<T, S = any> = AsyncGenerator<
  | { gen: () => DeserializeResult<S> }
  | { length: number },
  T,
  { value: S, chunk: Buffer }
>;

export type SerializeFunc<T> = (value: T) => SerializeResult
export type DeserializeFunc<T> = () => DeserializeResult<T>

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
      this.serialize = value => async function* () {
        const buffer = Buffer.alloc(length);
        args.serialize(value, buffer, 0);
        yield { value: buffer };
      }();
      this.deserialize = () => async function* () {
        const { chunk } = yield { length };
        return args.deserialize(chunk);
      }()
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
      serialize: value => async function* (this: Serializer<T>) {
        const mappedValue = await serialize(value);
        yield { gen: () => this.serialize(mappedValue) };
      }.call(this),
      deserialize: () => async function* (this: Serializer<T>): DeserializeResult<U> {
        let nextValue: any;
        const gen = this.deserialize();
        while (true) {
          const result = await gen.next(nextValue);
          if (result.done)
            return deserialize(result.value);
          nextValue = yield result.value;
        }
      }.call(this),
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
    return Readable.from(flattenRecursiveGen(serializer.serialize(value)));

    async function* flattenRecursiveGen(gen: SerializeResult | null): AsyncGenerator<Buffer, void, void> {
      while (true) {
        if (!gen)
          return;

        let result = await gen.next();

        if (result.done)
          return;

        let { value } = result;

        if ("value" in value) {
          yield value.value;
          continue;
        }

        let newGen = value.gen();
        let oldGen = gen;
        gen =
          !oldGen ?
            newGen :
            async function* () {
              yield* newGen;

              // yield* won't work here, as the "done" propagation triggers a call stack error
              gen = null;
              yield { gen: () => oldGen };
            }()
      }
    }
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
        onMoreData?.();
        if (onMoreData)
          throw new Error("Unexpected end of input");
      })

    stream.pause();

    return await flattenRecursiveGen(serializer.deserialize());

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

    async function flattenRecursiveGen(gen: DeserializeResult<any> | null): Promise<T> {
      let nextValue: any;
      while (true) {
        if (!gen)
          throw new Error("Interal error in tszer")

        let result = await gen.next(nextValue);

        if (result.done) {
          stream.destroy();
          return result.value;
        }

        const { value } = result;

        if ("length" in value) {
          nextValue = {
            chunk: await getChunk(value.length),
            get value() {
              throw new Error("Attempted to access value on yield of { length }");
            }
          }
          continue;
        }

        let newGen = value.gen();
        let oldGen = gen;
        gen =
          !oldGen ?
            newGen :
            async function* () {
              while (true) {
                const result = await newGen.next(nextValue);
                if (result.done) {
                  nextValue = {
                    value: result.value,
                    get chunk() {
                      throw new Error("Attempted to access chunk on yield of { gen }");
                    }
                  }
                  break;
                }
                yield result.value;
              }

              // yield* won't work here, as the "done" propagation triggers a call stack error
              gen = null;
              yield { gen: () => oldGen };
            }()
      }
    }
  }

}