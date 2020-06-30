import { Serializer } from "../src";

export const dss = async <T>(serializer: Serializer<T>, value: T) =>
  await Serializer.deserialize(serializer, Serializer.serialize(serializer, value))
