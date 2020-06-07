import { Serializer } from "./Serializer";

export const uintLE = (byteLength: number) => new Serializer<number>({
  length: byteLength,
  serialize: (num, buf, off) => buf.writeUIntLE(num, off, byteLength),
  deserialize: (buf, off) => buf.readUIntLE(off, byteLength),
});

export const uintBE = (byteLength: number) => new Serializer<number>({
  length: byteLength,
  serialize: (num, buf, off) => buf.writeUIntBE(num, off, byteLength),
  deserialize: (buf, off) => buf.readUIntBE(off, byteLength),
});

export const uint8 = () => uintLE(1);

export const uint16LE = () => uintLE(2);
export const uint32LE = () => uintLE(4);
export const uint48LE = () => uintLE(6);

export const uint16BE = () => uintBE(2);
export const uint32BE = () => uintBE(4);
export const uint48BE = () => uintBE(6);
