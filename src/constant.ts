import { Serializer } from "./Serializer";

export const constant = <T>(value: T, buffer = Buffer.alloc(0)) => new Serializer<T>({
  serialize: (_, writeChunk) => writeChunk(buffer),
  deserialize: async () => value,
});