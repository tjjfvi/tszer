import { Serializer, MapArgs } from "./Serializer";
import { concat } from "./concat";
import { array, optionalArray } from "./array";
import { uint16LE } from "./uint";

type Tree<N> = [N, Tree<N>[]];

export const tree = <N>(node: Serializer<N>, arrayLength = uint16LE()) =>
  <T>(map: MapArgs<[N, (T | undefined)[]], T>): Serializer<T> => {
    return new Serializer({
      serialize: async (tree, writeChunk) => {
        const entries: T[] = [tree];
        const reference = concat(
          node,
          optionalArray<T>(new Serializer<T>({
            serialize: async value => {
              entries.push(value);
            },
            deserialize: /* istanbul ignore next */ () => {
              throw new Error("Called deserialize on serialize-only Serializer");
            },
          }))
        ).map(map);
        for (let i = 0; i < entries.length; i++)
          await reference.serialize(entries[i], writeChunk);
      },
      deserialize: async getChunk => {
        type Entry = { value: Promise<T>, resolve: (value: Promise<T>) => void };

        const entries: Entry[] = [];
        addEntry();

        const reference = concat(
          node,
          optionalArray(new Serializer<Entry>({
            serialize: /* istanbul ignore next */ () => {
              throw new Error("Called serialize on deserialize-only Serializer");
            },
            deserialize: async () => addEntry(),
          }))
        ).map<{ value: Promise<T> }>({
          serialize: /* istanbul ignore next */ () => {
            throw new Error("Called serialize on deserialize-only Serializer");
          },
          deserialize: ([n, proms]) => ({
            value: Promise.all(proms.map(s => s?.value))
              .then((subs): [N, (T | undefined)[]] => [n, subs])
              .then(map.deserialize),
          })
        });

        for (let i = 0; i < entries.length; i++)
          entries[i].resolve((await reference.deserialize(getChunk)).value)

        return entries[0].value;

        function addEntry() {
          let resolve: (value: Promise<T>) => void;
          const promise = new Promise<T>(r => resolve = r);
          // @ts-ignore
          const entry = { value: promise, resolve };
          entries.push(entry);
          return entry;
        }
      },
    })
  }