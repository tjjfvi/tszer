import { Serializer } from "./Serializer"

export type Version = string | number | Buffer;

export const version = <V extends Version>(versions: V[]) => {
  const buffers = versions.map(versionToBuffer);
  checkVersionUnabiguity(buffers);
  return new Serializer<V>({
    serialize: (version, writeChunk) => writeChunk(versionToBuffer(version)),
    deserialize: async getChunk => {
      let pool = buffers.slice();
      let consumed = 0;
      let length = 0;
      while (pool.length && (length = Math.min(...pool.map(b => b.length)) - consumed)) {
        let chunk = await getChunk(length);
        pool = pool.filter(b => chunk.equals(b.slice(consumed, consumed + length)));
        consumed += length;
      }
      if (!pool.length)
        throw new Error("Invalid version");
      return versions[buffers.indexOf(pool[0])];
    }
  })
}

export const checkVersionUnabiguity = (buffers: Buffer[]) => {
  type Lookup = "end" | { [k: number]: Lookup } | undefined;
  let lookup: { [k: number]: Lookup } = { 0: undefined };
  for (let buffer of buffers) {
    let prevLookup = lookup;
    let key = 0;
    let ind = 0;
    while (true) {
      let curLookup = prevLookup[key];

      if (buffer.length === ind) {
        if (curLookup)
          throw new Error(ambiguousVersionErrorMessage(buffer, buffers));
        prevLookup[key] = "end";
        break;
      }

      curLookup = prevLookup[key] = curLookup ?? {};
      if (curLookup === "end")
        throw new Error(ambiguousVersionErrorMessage(buffer, buffers));
      prevLookup = curLookup;
      key = buffer[ind++];
    }
  }
}

export const versionToBuffer = (v: Version) =>
  v instanceof Buffer ?
    v.slice() :
    typeof v === "string" ?
      Buffer.from(v, "utf8") :
      Buffer.from([v])

const ambiguousVersionErrorMessage = (buffer: Buffer, buffers: Buffer[]) =>
  `Ambiguous version ${buffer.toString("hex")}\n` + buffers.map(b =>
    `  - ${b.toString("hex")}`
  ).join("\n")