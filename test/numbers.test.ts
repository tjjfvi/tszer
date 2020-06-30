import { Serializer, floatLE, floatBE, uint8, uint16LE, uint32LE, uint48LE, int8, int16LE, int32LE, int48LE, doubleLE, doubleBE, uint16BE, uint32BE, uint48BE, int16BE, int32BE, int48BE } from "../src";
import { dss } from "./dss";

describe.each<[string, Serializer<number>, number[]]>([
  ["floatLE", floatLE(), [1, 2, 3.84375, 2 ** 5]],
  ["floatBE", floatBE(), [1, 2, 3.84375, 2 ** 5]],
  ["doubleLE", doubleLE(), [1, 2, 3.84375, 2 ** 5]],
  ["doubleBE", doubleBE(), [1, 2, 3.84375, 2 ** 5]],
  ["uint8", uint8(), [1, 2, 3, 255]],
  ["uint16LE", uint16LE(), [1, 2, 3, 255, 2 ** 16 - 1]],
  ["uint16BE", uint16BE(), [1, 2, 3, 255, 2 ** 16 - 1]],
  ["uint32LE", uint32LE(), [1, 2, 3, 255, 2 ** 32 - 1]],
  ["uint32BE", uint32BE(), [1, 2, 3, 255, 2 ** 32 - 1]],
  ["uint48LE", uint48LE(), [1, 2, 3, 255, 2 ** 48 - 1]],
  ["uint48BE", uint48BE(), [1, 2, 3, 255, 2 ** 48 - 1]],
  ["int8", int8(), [1, -2, 3, 127, -127]],
  ["int16LE", int16LE(), [1, -2, 3, 255, 2 ** 15 - 1]],
  ["int16BE", int16BE(), [1, -2, 3, 255, 2 ** 15 - 1]],
  ["int32LE", int32LE(), [1, -2, 3, 255, 2 ** 31 - 1]],
  ["int32BE", int32BE(), [1, -2, 3, 255, 2 ** 31 - 1]],
  ["int48LE", int48LE(), [1, -2, 3, 255, 2 ** 47 - 1]],
  ["int48BE", int48BE(), [1, -2, 3, 255, 2 ** 47 - 1]],
])("%s", (_, ser, vals) => {
  test.each(vals)("%d", async val => {
    expect(await dss(ser, val)).toEqual(val);
  })
})