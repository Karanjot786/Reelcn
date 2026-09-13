import assert from "node:assert/strict";
import test from "node:test";
import { parseHeader, parseImports, themeNamesFromSource } from "./build-registry.ts";

const source = `/**
 * @title Text Reveal
 * @category text
 * @description Headline reveal.
 * @duration 30
 * @use Hero headlines
 * @use Section titles
 * @avoid Long paragraphs — use \`typewriter\`
 * @tags headline, kinetic
 * @example
 * <TextReveal text="Hi" />
 * <TextReveal text="Two" />
 */
import type React from "react";
import { interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import {
  tween,
  useMotion,
} from "./core";
import type { Caption } from "@remotion/captions";

export const x = 1;
`;

test("parseHeader reads single, repeated and multi-line tags", () => {
  const header = parseHeader(source, "text-reveal.tsx");
  assert.equal(header.title, "Text Reveal");
  assert.equal(header.category, "text");
  assert.equal(header.duration, "30");
  assert.deepEqual(header.use, ["Hero headlines", "Section titles"]);
  assert.deepEqual(header.avoid, ["Long paragraphs — use `typewriter`"]);
  assert.deepEqual(header.tags, ["headline", "kinetic"]);
  assert.equal(header.example, '<TextReveal text="Hi" />\n<TextReveal text="Two" />');
});

test("parseHeader rejects a missing header, missing tags and unknown categories", () => {
  assert.throws(() => parseHeader("export const x = 1;\n", "x.tsx"), /missing \/\*\* @title/);
  assert.throws(() => parseHeader("/**\n * @title X\n */\n", "x.tsx"), /missing @category/);
  assert.throws(() => parseHeader(source.replace("@category text", "@category nope"), "x.tsx"), /unknown @category/);
  assert.throws(() => parseHeader(source.replace("@duration 30", "@duration soon"), "x.tsx"), /invalid @duration/);
});

test("parseHeader requires a duration for components but not for libs", () => {
  assert.throws(() => parseHeader(source.replace(" * @duration 30\n", ""), "x.tsx"), /missing @duration/);
  const lib = source.replace("@category text", "@category lib").replace(" * @duration 30\n", "");
  assert.equal(parseHeader(lib, "core.tsx").duration, undefined);
});

test("parseImports separates sibling items from npm package roots", () => {
  assert.deepEqual(parseImports(source, "x.tsx"), {
    local: ["core"],
    npm: ["remotion", "@remotion/google-fonts", "@remotion/captions"],
  });
});

test("parseImports rejects relative imports that are not flat siblings", () => {
  assert.throws(() => parseImports('import { a } from "../core";\n', "x.tsx"), /flat sibling/);
  assert.throws(() => parseImports('import { a } from "./lib/core";\n', "x.tsx"), /flat sibling/);
});

test("parseImports ignores import lines inside template strings", () => {
  const code = 'import { a } from "./core";\nconst sample = `\nimport { b } from "left-pad";\n`;\n';
  assert.deepEqual(parseImports(code, "x.tsx"), { local: ["core"], npm: [] });
});

test("parseImports ignores `from` clauses that do not end the line", () => {
  const code =
    'import { a } from "./core";\nexport function X() {\n  return <C code={`import b from "left-pad"`} />\n}\n';
  assert.deepEqual(parseImports(code, "x.tsx"), { local: ["core"], npm: [] });
});

test("parseImports rejects path aliases and packages outside the allowlist", () => {
  assert.throws(() => parseImports('import { a } from "@/lib/core";\n', "x.tsx"), /path alias/);
  assert.throws(() => parseImports('import confetti from "canvas-confetti";\n', "x.tsx"), /allowlist/);
});

test("parseHeader requires @use for components", () => {
  assert.throws(() => parseHeader(source.replace(/ \* @use .*\n/g, ""), "x.tsx"), /missing @use/);
});

test("themeNamesFromSource reads preset names from core source", () => {
  const core = '  midnight: {\n    name: "midnight",\n  },\n  paper: {\n    name: "paper",\n  },\n';
  assert.deepEqual(themeNamesFromSource(core), ["midnight", "paper"]);
});

test("parseHeader reads repeatable @env names", () => {
  const tool = `/**
 * @title Transcribe
 * @category tools
 * @description Turns audio into captions.
 * @env OPENAI_API_KEY
 * @example
 * node scripts/reelcn-transcribe.ts talk.mp4
 */
export const x = 1;
`;
  assert.deepEqual(parseHeader(tool, "transcribe.ts").env, ["OPENAI_API_KEY"]);
  assert.deepEqual(parseHeader(source, "text-reveal.tsx").env, []);
});
