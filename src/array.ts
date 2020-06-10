import { Serializer } from "./Serializer";
import { concat, _concat } from "./concat";
import { uint16LE } from "./uint";

export const repeated = <T>(t: Serializer<T>, length: number): Serializer<T[]> => {
  return _concat(...Array(length).fill(t));
}

export const array = <T>(t: Serializer<T>, numberSerializer = uint16LE()) =>
  concat(
    numberSerializer,
    ([num]) => repeated(t, num),
  ).map<T[]>({
    serialize: val => [val.length, val],
    deserialize: ([, val]) => val,
  })
