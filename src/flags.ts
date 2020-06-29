import { uintLE, uint8 } from "./uint";
import { Serializer } from "./Serializer";
import { repeated } from "./array";

export function flags(count: 0): Serializer<[]>
export function flags(count: 1): Serializer<[boolean]>
export function flags(count: 2): Serializer<[boolean, boolean]>
export function flags(count: 3): Serializer<[boolean, boolean, boolean]>
export function flags(count: 4): Serializer<[boolean, boolean, boolean, boolean]>
export function flags(count: number): Serializer<boolean[]>
export function flags(count: number): Serializer<any> {
  const bytes = Math.ceil(count / 8);
  return repeated(uint8().map<boolean[]>({
    serialize: flags => flags.map((t, i) => +t << i).reduce((a, b) => a + b, 0),
    deserialize: num => Array(count).fill(undefined).map((_, i) => !!(num & (1 << i))),
  }), bytes).map<boolean[]>({
    serialize: flags => Array(bytes).fill(undefined).map((_, i) => flags.slice(i * 8, (i + 1) * 8)),
    deserialize: flagss => flagss.flatMap(f => f),
  })
}
