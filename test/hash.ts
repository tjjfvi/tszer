import { Readable } from "stream";
import { createHash } from "crypto";

export const hash = (stream: Readable) => {
  return new Promise<string>(res => {
    const hash = createHash("sha256");
    stream.pipe(hash).on("finish", () => {
      res(hash.digest("hex"));
      hash.destroy();
    })
  })
}