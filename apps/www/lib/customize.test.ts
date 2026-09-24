import assert from "node:assert/strict";
import test from "node:test";
import { sceneFile, sliderRange, toJsx } from "./customize.ts";

test("toJsx writes each value type the way JSX expects", () => {
  assert.equal(
    toJsx("TextReveal", { text: "Hi", size: 96, poster: true, split: undefined, accentWords: ["Hi"] }),
    '<TextReveal text="Hi" size={96} poster accentWords={["Hi"]} />',
  );
  assert.equal(toJsx("X", { text: 'say "hi"', on: false }), '<X text={"say \\"hi\\""} on={false} />');
});

test("toJsx breaks long elements one prop per line", () => {
  const jsx = toJsx("TextReveal", { text: "a".repeat(90), size: 96 });
  assert.equal(jsx, `<TextReveal\n  text="${"a".repeat(90)}"\n  size={96}\n/>`);
});

test("sliderRange fits the prop's name and starting value", () => {
  assert.deepEqual(sliderRange("weight", 700), { min: 100, max: 900, step: 100 });
  assert.deepEqual(sliderRange("size", 96), { min: 12, max: 300, step: 1 });
  assert.equal(sliderRange("stagger", 3).max, 90);
});

test("sceneFile imports from src/reelcn and wraps non-default themes", () => {
  const daylight = sceneFile("text-reveal", "TextReveal", '<TextReveal text="Hi" />', "daylight");
  assert.match(daylight, /import \{ Center, Stage \} from "\.\/reelcn\/core";/);
  assert.match(daylight, /import \{ TextReveal \} from "\.\/reelcn\/text-reveal";/);
  assert.doesNotMatch(daylight, /ThemeProvider/);
  const mono = sceneFile("text-reveal", "TextReveal", '<TextReveal text="Hi" />', "mono");
  assert.match(mono, /<ThemeProvider theme="mono">\n {6}<Stage>\n {8}<Center>\n {10}<TextReveal text="Hi" \/>/);
});
