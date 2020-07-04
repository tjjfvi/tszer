import { Serializer } from "../src/Serializer";
import { version, versionToBuffer, checkVersionUnabiguity, Version } from "../src/version";
import { dss } from "./dss";
import { Readable } from "stream";

const validVersionTests: [string, string[]][] = [
  ["justEmptyString", [""]],
  ["singleLetters", ["a", "b", "c"]],
  ["commonPrefix", ["aa", "ab", "ac"]],
  ["long", ["this is a sentence", "and another sentence", "and finally this"]],
  ["complex", [
    "apx",
    "apy",
    "apz",
    "aqx",
    "aqy0",
    "aqyw",
    "b",
    "special characters: !@#$%^&*()-_=+[]\\/><,.~",
    "weird: \0\b\v\t\f\n\r\x0B\u1234\u5678",
  ]]
]

describe("version", () => {
  describe.each(validVersionTests)("%s", (name, versions) => {
    const serializer = version(versions);
    test.each(versions)("%s", async version => {
      expect(await dss(serializer, version)).toEqual(version)
    })
    describe("invalid", () => {
      test("long", async () => {
        await expect(
          serializer.deserialize(Readable.from(["this is always invalid"]))
        ).rejects.toThrowErrorMatchingSnapshot();
      })
      if (name !== "justEmptyString")
        test("emptyString", async () => {
          await expect(
            serializer.deserialize(Readable.from([]))
          ).rejects.toThrowErrorMatchingSnapshot();
        })
    })
  })
});

describe("versionToBuffer", () => {
  test.each<[string, Version]>([
    ["emptyString", ""],
    ["string", "abc123"],
    ["buffer", Buffer.from([0x01, 0x18, 0x99, 0x98, 0x81, 0x99, 0x91, 0x19, 0x72, 0x53])],
    ["0", 0],
    ["1", 1],
    ["2", 2],
    ["255", 255],
  ])("%s", (_, version) => {
    expect(versionToBuffer(version)).toMatchSnapshot();
  })
})

describe("checkVersionUnambiguity", () => {
  describe("valid", () => {
    test.each(validVersionTests)("%s", (_, versions) => {
      const buffers = versions.map(versionToBuffer);
      expect(() => checkVersionUnabiguity(buffers)).not.toThrow();
    })
  })

  describe("invalid", () => {
    test.each<[string, string[]]>([
      ["emptyStringWithMultiple", ["", "a"]],
      ["singleLetters", ["a", "b", "c", "c"]],
      ["commonPrefix", ["aa", "ab", "ac", "acid"]],
      ["long", ["this is a sentence", "and another sentence", "and another sentence", "and finally this"]],
      ["complex", [
        "ap",
        "apx",
        "apy",
        "apya",
        "apz",
        "aqx",
        "aqy0",
        "apy0-prime",
        "aqyw",
        "b",
        "special characters: !@#$%^&*()-_=+[]\\/><,.~",
        "special characters: !@#$%^&*()-_=+[]\\/><,.~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
        "weird: \0\b\v\t\f\n\r\x0B\u1234\u5678",
        "weird: \0\b\v\t\f\n\r\x0B\u1234\u5678\x42",
      ]],
    ])("%s", (_, versions) => {
      const buffers = versions.map(versionToBuffer);
      expect(() => checkVersionUnabiguity(buffers)).toThrowErrorMatchingSnapshot();
    })
  })
})
