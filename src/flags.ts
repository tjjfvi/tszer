import { uintLE } from "./uint";
import { Serializer } from "./Serializer";

export const flags = (count: number) => uintLE(Math.ceil(count / 8)).map<boolean[]>({
  serialize: flags => flags.map((t, i) => +t << i).reduce((a, b) => a + b, 0),
  deserialize: num => Array(count).fill(undefined).map((_, i) => !!(num & (1 << i))),
})
