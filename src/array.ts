import { Serializer } from "./Serializer";
import { concat, _concat } from "./concat";
import { uint16LE } from "./uint";

export const repeated = <T>(t: Serializer<T>, length: number): Serializer<T[]> => {
  return new Serializer({
    serialize: async (values, writeChunk) => {
      if (values.length !== length)
        throw new Error("Invalid array passed to repeated");
      for (let i = 0; i < length; i++)
        await t.serialize(values[i], writeChunk);
    },
    deserialize: async getChunk => {
      let values: any[] = [];
      for (let i = 0; i < length; i++) {
        let value = await t.deserialize(getChunk);
        values.push(value);
      }
      return values;
    },
  })
}

export const array = <T>(t: Serializer<T>, numberSerializer = uint16LE()) =>
  concat(
    numberSerializer,
    ([num]) => repeated(t, num),
  ).map<T[]>({
    serialize: val => [val.length, val],
    deserialize: ([, val]) => val,
  })
