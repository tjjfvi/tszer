import { createReadStream } from "fs"
import { hash } from "./hash";
import { Serializer } from "../src/Serializer";
import { stlMesh } from "./stl";

test.each([
  ["The_Thinker_Decimated_Full_Size.stl"],
  ["20x20x10.stl"],
])("%s", async fileName => {
  const path = __dirname + "/stl/" + fileName;
  const readStream = createReadStream(path);
  const origHash = await hash(createReadStream(path));
  const deserialized = await stlMesh().deserialize(readStream);
  const reserializedHash = await hash(stlMesh().serialize(deserialized));
  expect(deserialized).toMatchSnapshot();
  expect(reserializedHash).toEqual(origHash);
})