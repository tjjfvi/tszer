import { Serializer, DeserializeResult, SerializeResult } from "./Serializer";
import { enga, Enga } from "enga";
import { deserialize } from "v8";
import { AsyncEnga, asyncEnga } from "enga/async";

export type ConcatArg<Prev, Cur> = Serializer<Cur> | ((prev: Prev) => Serializer<Cur>);

export function _concat(...args: ConcatArg<any[], any>[]): Serializer<any[]> {
  return new Serializer({
    serialize: value => value.map((v, i) => {
      let arg = args[i];
      if (typeof arg === "function")
        arg = arg(value.slice(0, i));
      return arg.serialize(v);
    }).reduce((accE, curE) => enga(
      accE,
      acc => enga(
        curE,
        cur => ({
          length: acc.length + cur.length,
          write: (buf, off) => enga(
            () => acc.write(buf, off),
            () => cur.write(buf, off + acc.length),
          )
        })
      )
    ), enga(() => ({ length: 0, write: () => enga(() => { }) }))),
    deserialize: (buf, off) => args.reduce<AsyncEnga<DeserializeResult<any[]>>>((accE, arg) => asyncEnga(
      accE,
      async acc => {
        if (typeof arg === "function")
          arg = arg(acc.value);
        return asyncEnga(
          arg.deserialize(buf, off + acc.length),
          async result => ({
            length: acc.length + result.length,
            value: [...acc.value, result.value],
          })
        )
      }
    ), asyncEnga(async () => ({ length: 0, value: [] }))),
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