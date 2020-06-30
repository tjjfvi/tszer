import { hash } from "./hash";
import { Serializer } from "../src/Serializer";
import { NumberTree, numberTree } from "./numberTree";

test("", async () => {
  let curTree: NumberTree = { val: 0 };

  while (curTree.val < 1000)
    curTree = { val: curTree.val + 1, left: curTree };

  const serialize = () => Serializer.serialize(numberTree(), curTree);
  const serializedHash = await hash(serialize());
  const deserialized = await Serializer.deserialize(numberTree(), serialize());
  expect(deserialized).toMatchSnapshot();
  expect(serializedHash).toMatchSnapshot();
})