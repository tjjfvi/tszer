
export interface SerializeResult {
  length: number,
  write: (buffer: Buffer, offset: number) => void
};

export interface DeserializeResult<T> {
  length: number,
  value: T,
}

export type SerializeFunc<T> = (value: T) => SerializeResult
export type DeserializeFunc<T> = (buffer: Buffer, offset: number) => DeserializeResult<T> | Promise<DeserializeResult<T>>

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

  private _serialize: SerializeFunc<T>;
  private _deserialize: DeserializeFunc<T>;

  serialize(value: T) {
    return this._serialize(value);
  }

  async deserialize(buffer: Buffer, offset: number) {
    return await this._deserialize(buffer, offset);
  }

  constructor(args: ConstLengthSerializerArgs<T>)
  constructor(args: SerializerArgs<T>)
  constructor(args: SerializerArgs<T> | ConstLengthSerializerArgs<T>) {
    if ("length" in args) {
      const { length } = args;
      this._serialize = value => ({
        length,
        write: (buffer, offset) => args.serialize(value, buffer, offset),
      })
      this._deserialize = async (buffer, offset) => ({
        length,
        value: await args.deserialize(buffer, offset),
      });
    } else {
      this._serialize = args.serialize;
      this._deserialize = args.deserialize;
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
      serialize: value => this.serialize(serialize(value)),
      deserialize: async (buffer: Buffer, offset: number) => {
        const result = await this.deserialize(buffer, offset);
        return { ...result, value: await deserialize(result.value) };
      }
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
    const { length, write } = serializer.serialize(value);
    const buffer = Buffer.alloc(length);
    write(buffer, 0);
    return buffer;
  }

  static async deserialize<T>(serializer: Serializer<T>, buffer: Buffer) {
    return (await serializer.deserialize(buffer, 0)).value;
  }

}