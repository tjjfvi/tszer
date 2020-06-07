import { Serializer } from "./Serializer";

export const floatLE = () => new Serializer<number>({
  length: 4,
  serialize: (num, buf, off) => buf.writeFloatLE(num, off),
  deserialize: (buf, off) => buf.readFloatLE(off),
});

export const floatBE = () => new Serializer<number>({
  length: 4,
  serialize: (num, buf, off) => buf.writeFloatLE(num, off),
  deserialize: (buf, off) => buf.writeFloatBE(off),
});
