import assert from "node:assert/strict";
import test from "node:test";
import { type CodeLanguage, type Token, tokenize } from "../registry/items/code-tokens.ts";

const samples: Record<CodeLanguage, string> = {
  ts: 'import { render } from "./render";\n\n/* Renders every\n   format. */\nexport async function build(fps: number): Promise<void> {\n  const label = `frames: ${fps * 2}`; // doubled\n  await render({ fps, codec: "h264", crf: 18.5 });\n}',
  js: "const list = [1, 2.5, 0xff];\nlist.map((n) => n * 2);\nconsole.log('it\\'s done');",
  tsx: 'export const Card = () => <Frame title="Hi">{count + 1}</Frame>;',
  py: 'def greet(name):\n    # say hello\n    return f"Hello, {name}" if name else None',
  bash: 'npx shadcn add ./r/core.json --yes # install\necho "$HOME" && ls -la | grep tsx',
  json: '{\n  "name": "reelcn",\n  "private": true,\n  "version": 2,\n  "files": ["a", null]\n}',
};

const kinds = (tokens: Token[]) => tokens.map((token) => `${token.kind}:${token.text}`);
const kindOf = (line: Token[], text: string) => line.find((token) => token.text.trim() === text)?.kind;

test("every language round-trips: joined token texts rebuild each line exactly", () => {
  for (const language of Object.keys(samples) as CodeLanguage[]) {
    const code = samples[language];
    const lines = tokenize(code, language);
    assert.equal(lines.length, code.split("\n").length, language);
    lines.forEach((line, index) => {
      assert.equal(line.map((token) => token.text).join(""), code.split("\n")[index], `${language} line ${index + 1}`);
    });
  }
});

test("ts: keywords, identifiers, punctuation, numbers and a trailing line comment", () => {
  const [line] = tokenize("const answer = 42; // done", "ts");
  assert.deepEqual(kinds(line), [
    "keyword:const",
    "plain: answer ",
    "punctuation:=",
    "plain: ",
    "number:42",
    "punctuation:;",
    "plain: ",
    "comment:// done",
  ]);
});

test("strings keep escaped quotes inside one token", () => {
  const [line] = tokenize('say("a \\"quoted\\" word", \'it\\\'s\');', "js");
  assert.equal(kindOf(line, '"a \\"quoted\\" word"'), "string");
  assert.equal(kindOf(line, "'it\\'s'"), "string");
  assert.equal(kindOf(line, "say"), "function");
});

test("a block comment spans lines and code after it is tokenized again", () => {
  const lines = tokenize("/* one\n   two\n   three */ let x = 1;", "ts");
  assert.deepEqual(kinds(lines[0]), ["comment:/* one"]);
  assert.deepEqual(kinds(lines[1]), ["comment:   two"]);
  assert.equal(lines[2][0].text, "   three */");
  assert.equal(lines[2][0].kind, "comment");
  assert.equal(kindOf(lines[2], "let"), "keyword");
  assert.equal(kindOf(lines[2], "1"), "number");
});

test("template literals continue across lines", () => {
  const lines = tokenize("const s = `a\nb` + 1;", "js");
  assert.equal(kindOf(lines[0], "`a"), "string");
  assert.equal(lines[1][0].text, "b`");
  assert.equal(lines[1][0].kind, "string");
  assert.equal(kindOf(lines[1], "1"), "number");
});

test("python: def/return keywords, calls and # comments", () => {
  const lines = tokenize(samples.py, "py");
  assert.equal(kindOf(lines[0], "def"), "keyword");
  assert.equal(kindOf(lines[0], "greet"), "function");
  assert.deepEqual(kinds(lines[1]), ["plain:    ", "comment:# say hello"]);
  assert.equal(kindOf(lines[2], "None"), "keyword");
  assert.equal(kindOf(lines[2], '"Hello, {name}"'), "string");
});

test("bash: command names, variables inside strings, flags and comments", () => {
  const lines = tokenize(samples.bash, "bash");
  assert.deepEqual(kinds(lines[0]), ["function:npx", "plain: shadcn add ./r/core.json --yes ", "comment:# install"]);
  assert.equal(kindOf(lines[1], "echo"), "function");
  assert.equal(kindOf(lines[1], '"$HOME"'), "string");
  assert.equal(kindOf(lines[1], "grep"), "function");
});

test("json: keys and values are strings, literals are keywords, numbers are numbers", () => {
  const lines = tokenize(samples.json, "json");
  assert.equal(kindOf(lines[1], '"name"'), "string");
  assert.equal(kindOf(lines[2], "true"), "keyword");
  assert.equal(kindOf(lines[3], "2"), "number");
  assert.equal(kindOf(lines[4], "null"), "keyword");
});
