import { tree } from "../src/tree";
import { floatLE } from "../src/float";
import { Serializer } from "../src";
import { constant } from "../src/constant";


export interface NumberTree {
  val: number,
  left?: NumberTree,
  right?: NumberTree,
}

export const numberTree = () => tree(floatLE(), constant(2))<NumberTree>({
  serialize: ({ val, left, right }) => [val, [left, right]],
  deserialize: ([val, [left, right]]) => ({ val, left, right }),
});
