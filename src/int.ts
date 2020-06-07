import { Serializer } from "./Serializer";

export const intLE = (byteLength: number) => new Serializer<number>({
  length: byteLength,
  serialize: (num, buf, off) => buf.writeIntLE(num, off, byteLength),
  deserialize: (buf, off) => buf.readIntLE(off, byteLength),
});

export const intBE = (byteLength: number) => new Serializer<number>({
  length: byteLength,
  serialize: (num, buf, off) => buf.writeIntBE(num, off, byteLength),
  deserialize: (buf, off) => buf.readIntBE(off, byteLength),
});

export const int8 = () => intLE(1);

export const int16LE = () => intLE(2);
export const int32LE = () => intLE(4);
export const int48LE = () => intLE(6);

export const int16BE = () => intBE(2);
export const int32BE = () => intBE(4);
export const int48BE = () => intBE(6);
