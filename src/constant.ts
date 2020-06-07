import { Serializer } from "./Serializer";

export const constant = <T>(value: T) => new Serializer<T>({
  length: 0,
  serialize: () => { },
  deserialize: () => value,
});