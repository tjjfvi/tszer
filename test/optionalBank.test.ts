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

test("backwardsCompatible", async () => {
  const oldSer = optionalBank(
    floatLE(),
    string(),
  );
  const newSer = optionalBank(
    floatLE(),
    string(),
    array(string()),
  );
  expect(await newSer.deserialize(oldSer.serialize([123, "abc"]))).toEqual([123, "abc", undefined]);
})
