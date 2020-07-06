import { concat, string, floatLE } from "../src";
import { versioned } from "../src/versioned";

const v1 = concat(floatLE(), string()).map<[string, number]>({
  serialize: ([a, b]) => [b, a],
  deserialize: ([a, b]) => [b, a],
})
const v2 = concat(string(), floatLE());

const testValue: [string, number] = ["abc", 123];

test("getVersion", async () => {
  const numberSerializer = floatLE();
  const fn = jest.fn(() => numberSerializer);
  const serializer = versioned({
    fn,
    ser: numberSerializer,
  }, "fn");
  expect(serializer.getVersion("fn")).toBe(numberSerializer);
  expect(serializer.getVersion("ser")).toBe(numberSerializer);
  expect(fn).toHaveBeenCalledTimes(1);
});

test("v1", async () => {
  const v1Mock = jest.fn(() => v1);
  const v2Mock = jest.fn(() => v2);
  const serializer = versioned({
    v1: v1Mock,
    v2: v2Mock,
  }, "v2");

  expect(await serializer.deserialize(serializer.withVersion("v1").serialize(testValue))).toEqual(testValue);
  expect(v1Mock).toHaveBeenCalledTimes(2);
  expect(v2Mock).toHaveBeenCalledTimes(0);
})

test("v2", async () => {
  const v1Mock = jest.fn(() => v1);
  const v2Mock = jest.fn(() => v2);
  const serializer = versioned({
    v1: v1Mock,
    v2: v2Mock,
  }, "v2");

  expect(await serializer.deserialize(serializer.withVersion("v2").serialize(testValue))).toEqual(testValue);
  expect(v1Mock).toHaveBeenCalledTimes(0);
  expect(v2Mock).toHaveBeenCalledTimes(2);
})
