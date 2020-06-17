import { Serializer } from "./Serializer";

export const doubleLE = () => new Serializer<number>({
  length: 8,
  serialize: (num, buf, off) => buf.writeDoubleLE(num, off),
  deserialize: (buf) => buf.readDoubleLE(0),
});

export const doubleBE = () => new Serializer<number>({
  length: 8,
  serialize: (num, buf, off) => buf.writeDoubleBE(num, off),
  deserialize: (buf) => buf.readDoubleBE(0),
});
