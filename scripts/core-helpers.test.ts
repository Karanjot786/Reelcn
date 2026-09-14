import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors clamp01/graphemeInitial's math without a React/Remotion import — core.tsx is JSX and node --test's
// native TypeScript loader can't strip it (same reason core-role-motion.test.ts, core-viewport.test.ts and
// core-stagger.test.ts mirror instead of importing).
const clamp01 = (n: number): number => Math.min(Math.max(n, 0), 1);

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en-US", { granularity: "grapheme" }) : null;

const graphemes = (text: string) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);

const graphemeInitial = (name: string): string => graphemes(name)[0] ?? "";

test("clamp01 boundary values", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0), 0);
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(1), 1);
  assert.equal(clamp01(2), 1);
});

test("graphemeInitial keeps a whole emoji together", () => {
  assert.equal(graphemeInitial("👩‍🚀 Ada"), "👩‍🚀");
});

test("graphemeInitial handles a CJK name", () => {
  assert.equal(graphemeInitial("田中さん"), "田");
});

test("graphemeInitial keeps a combining mark with its base letter", () => {
  assert.equal(graphemeInitial("Áda"), "Á");
});

test("graphemeInitial on an empty string returns an empty string", () => {
  assert.equal(graphemeInitial(""), "");
});
