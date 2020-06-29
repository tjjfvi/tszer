import { Serializer, DeserializeResult } from "./Serializer";

export type ConcatArg<Prev, Cur> = Serializer<Cur> | ((prev: Prev) => Serializer<Cur>);

export function _concat(...args: ConcatArg<any[], any>[]): Serializer<any[]> {
  return new Serializer({
    serialize: async (values, writeChunk) => {
      if (values.length !== args.length)
        throw new Error("Invalid array passed to concat");
      for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        let val = values[i];
        if (typeof arg === "function")
          await arg(values).serialize(val, writeChunk)
        else
          await arg.serialize(val, writeChunk)
      }
    },
    deserialize: async getChunk => {
      let values: any[] = [];
      for (let arg of args) {
        let value = await (
          typeof arg === "function" ?
            arg(values).deserialize(getChunk) :
            arg.deserialize(getChunk)
        );
        values.push(value);
      }
      return values;
    },
  })
}

export function concat<A>(a: ConcatArg<[], A>): Serializer<[A]>
export function concat<A, B>(a: ConcatArg<[], A>, b: ConcatArg<[A], B>): Serializer<[A, B]>
export function concat<A, B, C>(a: ConcatArg<[], A>, b: ConcatArg<[A], B>, c: ConcatArg<[A, B], C>): Serializer<[A, B, C]>
export function concat<A, B, C, D>(a: ConcatArg<[], A>, b: ConcatArg<[A], B>, c: ConcatArg<[A, B], C>, d: ConcatArg<[A, B, C], D>): Serializer<[A, B, C, D]>
export function concat<A, B, C, D, E>(
  a: ConcatArg<[], A>,
  b: ConcatArg<[A], B>,
  c: ConcatArg<[A, B], C>,
  d: ConcatArg<[A, B, C], D>,
  e: ConcatArg<[A, B, C, D], E>
): Serializer<[A, B, C, D, E]>
export function concat(...args: ConcatArg<any, any>[]): Serializer<any> {
  return _concat(...args);
}