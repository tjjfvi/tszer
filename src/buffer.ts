import { uint16LE } from "./uint";
import { concat } from "./concat";
import { Serializer } from "./Serializer";

export const constLengthBuffer = (length: number) => new Serializer<Buffer>({
  length,
  serialize: (val, buf, off) => buf.fill(val, off, off + length),
  deserialize: (buf, off) => buf.slice(off, off + length),
});

export const buffer = (numberSerializer = uint16LE()) => concat(
  numberSerializer,
  ([num]) => constLengthBuffer(num),
).map<Buffer>({
  serialize: buf => [buf.length, buf],
  deserialize: ([, buf]) => buf,
});