import { Serializer } from "./Serializer";
import { concat } from "./concat";
import { uint16LE } from "./uint";

export const repeated = <T>(t: Serializer<T>, length: number): Serializer<T[]> => {
  if (length === 1)
    return t.map({
      serialize: (arr) => {
        if (arr.length !== 1)
          throw new Error("repeated was passed invalid array of length !== 1");
        return arr[0];
      },
      deserialize: t => [t],
    });
  return concat(t, repeated(t, length - 1)).map({
    serialize: (arr) => {
      if (arr.length !== length)
        throw new Error(`repeated was passed invalid array of length !== ${length}`);
      return [arr[0], arr.slice(1)];
    },
    deserialize: ([val, arr]) => [val, ...arr],
  });
}

export const array = <T>(t: Serializer<T>, numberSerializer = uint16LE()) =>
  concat(
    numberSerializer,
    ([num]) => repeated(t, num),
  ).map<T[]>({
    serialize: val => [val.length, val],
    deserialize: ([, val]) => val,
  })
