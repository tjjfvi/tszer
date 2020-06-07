
export interface SerializeResult {
  length: number,
  write: (buffer: Buffer, offset: number) => void
};

export interface DeserializeResult<T> {
  length: number,
  value: T,
}

export type SerializeFunc<T> = (value: T) => SerializeResult
export type DeserializeFunc<T> = (buffer: Buffer, offset: number) => DeserializeResult<T>

export interface SerializerArgs<T> {
  serialize: SerializeFunc<T>,
  deserialize: DeserializeFunc<T>,
}

export type ConstLengthSerializeFunc<T> = (value: T, buffer: Buffer, offset: number) => void
export type ConstLengthDeserializeFunc<T> = (buffer: Buffer, offset: number) => T

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
      this.serialize = value => ({
        length,
        write: (buffer, offset) => args.serialize(value, buffer, offset),
      })
      this.deserialize = (buffer, offset) => ({
        length,
        value: args.deserialize(buffer, offset),
      });
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
    deserialize: (value: T) => U,
  }) {
    return new Serializer<U>({
      serialize: value => this.serialize(serialize(value)),
      deserialize: (buffer: Buffer, offset: number) => {
        const result = this.deserialize(buffer, offset);
        return { ...result, value: deserialize(result.value) };
      }
    })
  }

  static serialize<T>(serializer: Serializer<T>, value: T) {
    const { length, write } = serializer.serialize(value);
    const buffer = Buffer.alloc(length);
    write(buffer, 0);
    return buffer;
  }

  static deserialize<T>(serializer: Serializer<T>, buffer: Buffer) {
    return serializer.deserialize(buffer, 0).value;
  }

}