import { Serializer } from "../src";

export const dss = async <T>(serializer: Serializer<T>, value: T) =>
  await serializer.deserialize(serializer.serialize(value))
