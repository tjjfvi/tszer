import { Enga, enga } from "enga";
import { AsyncEnga, asyncEnga } from "enga/async";

export interface SerializeResult {
  length: number,
  write: (buffer: Buffer, offset: number) => Enga<void>
};

export interface DeserializeResult<T> {
  length: number,
  value: T,
}

export type SerializeFunc<T> = (value: T) => Enga<SerializeResult>
export type DeserializeFunc<T> = (buffer: Buffer, offset: number) => AsyncEnga<DeserializeResult<T>>

export interface SerializerArgs<T> {
  serialize: SerializeFunc<T>,
  deserialize: DeserializeFunc<T>,
}

export type ConstLengthSerializeFunc<T> = (value: T, buffer: Buffer, offset: number) => void
export type ConstLengthDeserializeFunc<T> = (buffer: Buffer, offset: number) => T | Promise<T>

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
      this.serialize = value => enga(() => ({
        length,
        write: (buffer, offset) => enga(() => args.serialize(value, buffer, offset)),
      }))
      this.deserialize = (buffer, offset) => asyncEnga(async () => ({
        length,
        value: await args.deserialize(buffer, offset),
      }));
    } else {
      this.serialize = args.serialize;
      this.deserialize = args.deserialize;
    }
  }

  map<U>({
    serialize,
    deserialize,
  }: {
    serialize: (value: U) => T,
    deserialize: (value: T) => U | Promise<U>,
  }) {
    return new Serializer<U>({
      serialize: value => enga(
        () => serialize(value),
        this.serialize,
      ),
      deserialize: (buffer: Buffer, offset: number) => asyncEnga(
        this.deserialize(buffer, offset),
        async result => ({ ...result, value: await deserialize(result.value) })
      ),
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

  static serialize<T>(serializer: Serializer<T>, value: T) {
    const { length, write } = serializer.serialize(value).execute();
    const buffer = Buffer.alloc(length);
    write(buffer, 0).execute();
    return buffer;
  }

  static async deserialize<T>(serializer: Serializer<T>, buffer: Buffer) {
    return (await serializer.deserialize(buffer, 0).execute()).value;
  }

}