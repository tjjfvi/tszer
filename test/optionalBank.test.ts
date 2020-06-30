import { optionalBank, floatLE, string, flags, array, optionalArray } from "../src";
import { dss } from "./dss";

const serializer = optionalBank(floatLE(), string(), array(string()));

test.each<[string, [number?, string?, string[]?]]>([
  ["allUndefined", [undefined, undefined, undefined]],
  ["somePresent", [undefined, "a", undefined]],
  ["allPresent", [5, "a", ["x", "y", "z"]]],
])("%s", async (_, args) => {
  expect(await dss(serializer, args)).toEqual(args);
});
