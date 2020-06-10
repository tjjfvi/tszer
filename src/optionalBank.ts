import { Serializer } from "./Serializer";
import { concat, _concat } from "./concat";
import { flags } from "./flags";
import { constant } from "./constant";
import { doubleLE } from "./double";
import { strict } from "assert";
import { string } from "./string";
import { array } from "./array";

export function optionalBank<A>(a: Serializer<A>): Serializer<[A?]>
export function optionalBank<A, B>(a: Serializer<A>, b: Serializer<B>): Serializer<[A?, B?]>
export function optionalBank<A, B, C>(a: Serializer<A>, b: Serializer<B>, c: Serializer<C>): Serializer<[A?, B?, C?]>
export function optionalBank<A, B, C, D>(a: Serializer<A>, b: Serializer<B>, c: Serializer<C>, d: Serializer<D>): Serializer<[A?, B?, C?, D?]>
export function optionalBank<A, B, C, D, E>(
  a: Serializer<A>,
  b: Serializer<B>,
  c: Serializer<C>,
  d: Serializer<D>,
  e: Serializer<E>
): Serializer<[A?, B?, C?, D?, E?]>
export function optionalBank(...args: Serializer<any>[]): Serializer<any> {
  return concat(
    flags(args.length),
    ([flags]) => _concat(...args.map<Serializer<any>>((a, i) => (
      flags[i] ? constant(undefined) : a
    )))
  ).map({
    serialize: vals => [vals.map((val: any) => val === undefined), vals],
    deserialize: ([, vals]) => vals,
  })
}
