import { uint16LE } from "./uint";
import { buffer, constLengthBuffer } from "./buffer";

export const constLengthString = (length: number, encoding: BufferEncoding = "utf8") =>
  constLengthBuffer(length).map<string>({
    serialize: val => {
      if (val.length !== length)
        throw new Error(`Invalid string passed to constLengthString; expected length of ${length}`);
      return Buffer.from(val, encoding);
    },
    deserialize: buf => buf.toString(encoding),
  })

export const string = (encoding: BufferEncoding = "utf8", numberSerializer = uint16LE()) =>
  buffer(numberSerializer).map<string>({
    serialize: val => Buffer.from(val, encoding),
    deserialize: buf => buf.toString(encoding),
  });