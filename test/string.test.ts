import { dss } from "./dss";
import { string, constLengthString } from "../src";

const cases = [
  ["empty string", ""],
  ['"test"', "test"],
  ["lorem ipsum", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tincidunt tortor diam, eu convallis felis sollicitudin quis. Mauris quis imperdiet sapien. Phasellus vel felis quis magna accumsan finibus. Donec tellus mi, vulputate vestibulum hendrerit quis, laoreet sed ligula. Fusce pulvinar velit eget magna porta tincidunt. Quisque ut pulvinar tortor. Aliquam ultricies maximus quam, sit amet sollicitudin metus cursus quis.
In maximus dignissim lectus ut placerat. Fusce facilisis condimentum metus, eu finibus risus. Ut id tempus nisl, sed dignissim massa. Sed nec nisi ut ligula facilisis facilisis ut quis lacus. Maecenas fermentum nisl nec aliquam ornare. Sed lacus libero, vehicula eu dolor non, sagittis gravida nisi. In vitae lorem eu tortor varius ultricies quis sit amet ipsum. Aenean eget sapien sem. Sed accumsan arcu id massa dictum ultricies. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam a sodales augue. Phasellus dictum maximus sagittis. Aliquam vel placerat orci, vel luctus odio. In hac habitasse platea dictumst. Nulla condimentum vulputate condimentum.
Duis dictum pellentesque leo, ut sollicitudin justo interdum nec. Duis tempus hendrerit turpis, eu pretium ex. Vestibulum malesuada est vel dolor ultrices, sit amet egestas sem cursus. Nam porttitor leo mauris, id vestibulum mauris dictum eu. Etiam gravida in lectus a rutrum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris urna lectus, auctor quis imperdiet vehicula, sollicitudin quis neque. Maecenas euismod, turpis non varius tristique, mauris dolor dapibus sem, eu interdum dui neque et nisl. Donec nec vehicula est.
Curabitur vitae lorem lacus. In rhoncus nisl dui, id dignissim dolor pretium in. Maecenas sed magna sed dolor aliquet maximus sit amet nec libero. Sed dictum eleifend pulvinar. Vestibulum aliquet sem metus, quis faucibus nulla viverra non. Donec vehicula elementum massa, vitae tincidunt diam hendrerit imperdiet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod malesuada leo et congue. Cras auctor velit nec diam rhoncus tristique. Nam pretium tortor quis dui imperdiet commodo. Integer efficitur ex et purus suscipit gravida. Phasellus dui quam, volutpat vitae tempus eget, fermentum in justo. Aliquam erat volutpat. Phasellus eu congue orci.
Sed a felis tincidunt, volutpat augue non, semper mauris. Nulla facilisis lacus quis nisi sagittis, non euismod lectus rutrum. Morbi blandit at quam at interdum. Proin nec convallis est. Etiam mollis neque sit amet egestas facilisis. Fusce semper suscipit risus, vitae eleifend odio volutpat id. Pellentesque aliquet varius nisl, a ornare ante semper ut. Pellentesque efficitur in erat eu dignissim. Aenean eget mollis enim, sit amet lacinia sem. Vivamus venenatis, libero sit amet vehicula pellentesque, velit nunc lacinia magna, eget euismod massa erat vitae lorem. Curabitur eu elit nisl. Integer sed posuere felis, non sollicitudin ipsum. Duis aliquam augue metus, a viverra ligula aliquet in. Curabitur id arcu interdum, rutrum ante sit amet, cursus libero.
`]
];

describe("constLengthString", () => {
  test.each(cases)("%s", async (_, str) => {
    expect(await dss(constLengthString(str.length), str)).toEqual(str);
  })

  describe("errors on invalid length", () => {
    test("longer", async () => {
      await expect(constLengthString(1).serialize("longer", () => Promise.resolve())).rejects.toThrow();
    })
    test("shorter", async () => {
      await expect(constLengthString(100).serialize("shorter", () => Promise.resolve())).rejects.toThrow();
    })
  })
})

describe("string", () => {
  test.each(cases)("%s", async (_, str) => {
    expect(await dss(string(), str)).toEqual(str);
  })
})
