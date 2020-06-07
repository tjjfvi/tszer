import { Serializer, DeserializeResult } from "./Serializer";

export type ConcatArg<Prev, Cur> = Serializer<Cur> | ((prev: Prev) => Serializer<Cur>);

function _concat(...args: ConcatArg<any[], any>[]): Serializer<any[]> {
  return new Serializer({
    serialize: value => value.map((v, i) => {
      let arg = args[i];
      if (typeof arg === "function")
        arg = arg(value.slice(0, i));
      return arg.serialize(v);
    }).reduce((acc, cur) => ({
      length: acc.length + cur.length,
      write: (buf, off) => {
        acc.write(buf, off);
        cur.write(buf, off + acc.length);
      }
    }), { length: 0, write: () => { } }),
    deserialize: (buf, off) => args.reduce<DeserializeResult<any[]>>((acc, arg) => {
      if (typeof arg === "function")
        arg = arg(acc.value);
      let result = arg.deserialize(buf, off + acc.length);
      return {
        length: acc.length + result.length,
        value: [...acc.value, result.value],
      }
    }, { length: 0, value: [] }),
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