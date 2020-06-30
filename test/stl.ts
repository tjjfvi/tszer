import { concat } from "../src/concat";
import { floatLE } from "../src/float";
import { uint16LE, uint32LE } from "../src/uint";
import { constLengthString } from "../src/string";
import { array } from "../src/array";

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

export const stlMesh = () =>
  concat(
    constLengthString(80),
    array(stlFace(), uint32LE()),
  ).map<Mesh>({
    serialize: ({ name, faces }) => [(name ?? "").padEnd(80, " ").slice(0, 80), faces],
    deserialize: ([name, faces]) => ({ name, faces })
  })
