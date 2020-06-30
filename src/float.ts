import { Serializer } from "./Serializer";

export const floatLE = () => new Serializer<number>({
  length: 4,
  serialize: (num, buf, off) => buf.writeFloatLE(num, off),
  deserialize: (buf) => buf.readFloatLE(0),
});

export const floatBE = () => new Serializer<number>({
  length: 4,
  serialize: (num, buf, off) => buf.writeFloatBE(num, off),
  deserialize: (buf) => buf.readFloatBE(0),
});
