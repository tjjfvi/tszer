import { Serializer } from "./Serializer";
import { concat, _concat } from "./concat";
import { uint16LE } from "./uint";
import { flags } from "./flags";
import { constant } from "./constant";

export const repeated = <T>(t: Serializer<T> | ((i: number) => Serializer<T>), length: number): Serializer<T[]> => {
  return new Serializer({
    serialize: async (values, writeChunk) => {
      if (values.length !== length)
        throw new Error("Invalid array passed to repeated");
      for (let i = 0; i < length; i++)
        if (typeof t === "function")
          await t(i).serialize(values[i], writeChunk)
        else
          await t.serialize(values[i], writeChunk)
    },
    deserialize: async getChunk => {
      let values: any[] = [];
      for (let i = 0; i < length; i++) {
        let value = await (
          typeof t === "function" ?
            t(i).deserialize(getChunk) :
            t.deserialize(getChunk)
        );
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

export const optionalArray = <T>(t: Serializer<T>, numberSerializer = uint16LE()) =>
  concat(
    numberSerializer,
    ([num]) => flags(num),
    ([num, flags]) => repeated<T | undefined>(i => flags[i] ? t as any : constant(undefined), num),
  ).map<(T | undefined)[]>({
    serialize: val => [val.length, val.map(val => val !== undefined), val],
    deserialize: ([, , val]) => val,
  })
