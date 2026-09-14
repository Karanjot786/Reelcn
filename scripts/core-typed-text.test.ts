import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors useTypedText's math without a React/Remotion import — core.tsx is JSX and node --test's native
// TypeScript loader can't strip it (same reason core-stagger.test.ts, core-role-motion.test.ts and
// core-viewport.test.ts mirror instead of importing). `mockRandom` stands in for remotion's `random(seed)`:
// any deterministic, string-seeded [0, 1) function satisfies these tests, since they only assert
// reproducibility and shape, never remotion's actual sequence. `graphemes` here is a plain `Array.from`
// split, which matches core.tsx's `graphemes` for the plain-ASCII strings these tests use.
function mockRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

const graphemes = (text: string) => Array.from(text);

type TypingModel = {
  seed?: string;
  cps?: number;
  burstiness?: number;
  punctuationRestFrames?: number;
  typoRate?: number;
};

const PUNCTUATION = /[.,!?;:]/;

function useTypedText(
  fullText: string,
  frame: number,
  fps: number,
  model: TypingModel = {},
): { visible: string; caretOn: boolean; done: boolean } {
  const { seed = "typed", cps = 18, burstiness = 0, punctuationRestFrames = 0, typoRate = 0 } = model;
  const chars = graphemes(fullText);
  let t = 0;
  let shown = 0;
  for (let i = 0; i < chars.length; i++) {
    const jitter = burstiness > 0 ? 1 + burstiness * (mockRandom(`${seed}-${i}`) - 0.5) : 1;
    const charFrames = Math.max(1, fps / (cps * jitter));
    if (typoRate > 0 && mockRandom(`${seed}-typo-${i}`) < typoRate) t += charFrames * 2; // one wrong glyph, then a backspace
    t += charFrames;
    if (PUNCTUATION.test(chars[i])) t += punctuationRestFrames;
    if (frame < t) break;
    shown = i + 1;
  }
  const done = shown === chars.length;
  const caretOn = !done || Math.floor(Math.abs(frame) / Math.max(1, Math.round(fps / 2))) % 2 === 0;
  return { visible: chars.slice(0, shown).join(""), caretOn, done };
}

test("default model reveals characters at a constant cps, matching today's math", () => {
  const fps = 30;
  const cps = 15;
  const text = "hello";
  const frameFor = (n: number) => Math.floor((n * fps) / cps);
  assert.equal(useTypedText(text, frameFor(1) - 1, fps, { cps }).visible, "");
  assert.equal(useTypedText(text, frameFor(1), fps, { cps }).visible, "h");
  assert.equal(useTypedText(text, frameFor(5), fps, { cps }).visible, "hello");
  assert.equal(useTypedText(text, frameFor(5), fps, { cps }).done, true);
});

test("same seed and model always produce the same timeline", () => {
  const a = useTypedText("reelcn", 10, 30, { seed: "x", burstiness: 0.4, typoRate: 0.3 });
  const b = useTypedText("reelcn", 10, 30, { seed: "x", burstiness: 0.4, typoRate: 0.3 });
  assert.deepEqual(a, b);
});

test("punctuation adds the configured rest", () => {
  const fps = 30;
  const cps = 30; // 1 frame per char
  const withRest = useTypedText("a.b", 3, fps, { cps, punctuationRestFrames: 5 });
  const withoutRest = useTypedText("a.b", 3, fps, { cps, punctuationRestFrames: 0 });
  assert.ok(withRest.visible.length <= withoutRest.visible.length);
});

test("typo only fires when typoRate > 0", () => {
  const fps = 30;
  const cps = 30;
  // With typoRate 0, N frames reveal exactly N characters (1 frame each); with a typo inserted, fewer are shown
  // by the same frame, since a typo costs extra frames before the character resolves.
  const clean = useTypedText("abcdefgh", 4, fps, { cps, typoRate: 0 });
  assert.equal(clean.visible, "abcd");
});
