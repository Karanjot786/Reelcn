import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQuery,
  decodeEdits,
  encodeEdits,
  isHexColor,
  parseDefault,
  pruneEdits,
  sceneFile,
  sliderRange,
  startValues,
  toJsx,
  unitFor,
} from "./customize.ts";

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

const ROWS = [
  { name: "text", control: "text" },
  { name: "size", control: "slider", default: "96" },
  { name: "effect", control: "select", options: ["rise", "blur"], default: '"rise"' },
  { name: "poster", control: "switch" },
  { name: "color", control: "color" },
  { name: "accentWords", control: "list", default: "[]" },
];

test("parseDefault reads JSON literals and ignores expressions", () => {
  assert.equal(parseDefault('"rise"'), "rise");
  assert.equal(parseDefault("96"), 96);
  assert.equal(parseDefault("fps * 0.6"), undefined);
  assert.equal(parseDefault(undefined), undefined);
});

test("startValues prefers the demo's props over declared defaults", () => {
  assert.deepEqual(startValues(ROWS, { text: "Hi", effect: "blur" }), {
    text: "Hi",
    effect: "blur",
    size: 96,
    accentWords: [],
  });
});

test("pruneEdits drops edits equal to the start, and undefined", () => {
  const start = { text: "Hi", size: 96, accentWords: ["a"] };
  assert.deepEqual(pruneEdits(start, { text: "Hi", size: 120, accentWords: ["a"], color: undefined }), { size: 120 });
});

test("isHexColor accepts full hex only", () => {
  assert.ok(isHexColor("#ff0000"));
  assert.ok(isHexColor("#F00"));
  assert.ok(!isHexColor("#ff"));
  assert.ok(!isHexColor("red"));
});

test("unitFor labels frame-count props", () => {
  assert.equal(unitFor("stagger"), "frames");
  assert.equal(unitFor("size"), undefined);
});

test("encodeEdits writes p.<prop> params; decodeEdits reads them back", () => {
  const edits = {
    text: "Hello, you",
    size: 120,
    effect: "blur",
    poster: true,
    color: "#ff0000",
    accentWords: ["a", "b"],
  };
  const params = new URLSearchParams(encodeEdits(edits));
  assert.deepEqual(params.getAll("p.accentWords"), ["a", "b"]);
  // Text keeps its comma; lists split on commas.
  assert.deepEqual(decodeEdits(ROWS, params), edits);
});

test("decodeEdits drops hostile and unknown params", () => {
  const params = new URLSearchParams(
    `p.size=abc&p.effect=nope&p.poster=yes&p.color=javascript:alert(1)&p.foo=1&p.text=${"x".repeat(500)}`,
  );
  const out = decodeEdits(ROWS, params);
  assert.deepEqual(Object.keys(out), ["text"]);
  assert.equal((out.text as string).length, 200);
  assert.equal(decodeEdits(ROWS, new URLSearchParams("p.size=1e308")).size, undefined);
  assert.equal(decodeEdits(ROWS, new URLSearchParams("p.size=-40")).size, -40);
});

test("buildQuery replaces our params and keeps everything else", () => {
  assert.equal(
    buildQuery("?utm=x&p.size=1&demo=old", { demo: "blur", theme: "mono", edits: { size: 120 } }),
    "?utm=x&demo=blur&theme=mono&p.size=120",
  );
  assert.equal(buildQuery("?p.size=1&theme=mono", { edits: {} }), "");
});

test("toJsx keeps newlines and entities intact", () => {
  assert.equal(toJsx("T", { text: "a\nb" }), '<T text={"a\\nb"} />');
  assert.equal(toJsx("T", { text: "A &amp; B" }), '<T text={"A &amp; B"} />');
});

test("list edits keep commas through a share link", () => {
  const params = new URLSearchParams(encodeEdits({ accentWords: ["videos,", "b"] }));
  assert.deepEqual(params.getAll("p.accentWords"), ["videos,", "b"]);
  assert.deepEqual(decodeEdits(ROWS, params).accentWords, ["videos,", "b"]);
  assert.equal(buildQuery("", { edits: { accentWords: ["a,1", "b"] } }), "?p.accentWords=a%2C1&p.accentWords=b");
});

test("decodeEdits caps hostile lists", () => {
  const many = new URLSearchParams(Array.from({ length: 50 }, (_, i) => ["p.accentWords", `w${i}`]));
  assert.equal((decodeEdits(ROWS, many).accentWords as string[]).length, 20);
  const long = decodeEdits(ROWS, new URLSearchParams([["p.accentWords", "x".repeat(500)]])).accentWords as string[];
  assert.equal(long[0].length, 200);
});
