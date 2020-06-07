import { concat } from "./concat";
import { floatLE } from "./float";
import { uint16LE, uint32LE } from "./uint";
import { constLengthString } from "./string";
import { array } from "./array";
import { readFileSync } from "fs";
import { Serializer } from "./Serializer";
import { createHash } from "crypto";

interface Vector3 {
  x: number,
  y: number,
  z: number,
}

interface Face {
  vertices: [Vector3, Vector3, Vector3]
  normal: Vector3
}

interface Mesh {
  name?: string,
  faces: Face[]
}

const vector3 = () =>
  concat(
    floatLE(),
    floatLE(),
    floatLE(),
  ).map<Vector3>({
    serialize: ({ x, y, z }) => [x, y, z],
    deserialize: ([x, y, z]) => ({ x, y, z }),
  })

const stlFace = () =>
  concat(
    vector3,
    concat(
      vector3,
      vector3,
      vector3,
    ),
    uint16LE()
  ).map<Face>({
    serialize: face => [face.normal, face.vertices, 0],
    deserialize: ([normal, vertices]) => ({ normal, vertices, }),
  });

const stlMesh = () =>
  concat(
    constLengthString(80),
    array(stlFace(), uint32LE()),
  ).map<Mesh>({
    serialize: ({ name, faces }) => [(name ?? "").padEnd(80, " ").slice(0, 80), faces],
    deserialize: ([name, faces]) => ({ name, faces })
  })

const stlFile = readFileSync("../escad-testtest.stl");

let mesh = Serializer.deserialize(stlMesh(), stlFile);

console.log(createHash("sha256").update(stlFile).digest().toString("hex"));
console.log(createHash("sha256").update(Serializer.serialize(stlMesh(), mesh)).digest().toString("hex"));
