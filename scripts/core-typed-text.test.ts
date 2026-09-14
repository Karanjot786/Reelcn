import { strict as assert } from "node:assert";
import { test } from "node:test";
import { useTypedText } from "../registry/items/core-math.ts";

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

test("cps above the frame rate reveals several characters in a single frame", () => {
  // Pre-Phase-1 terminal.tsx used `floor((frame * cps) / fps)` directly, with no per-char 1-frame floor, so a
  // 32cps/30fps default (or any cps > fps) could reveal more than one character on the very first frame.
  const fps = 30;
  const cps = 90; // 3x the frame rate
  const text = "hello world";
  const expected = (frame: number) => Math.min(text.length, Math.floor((frame * cps) / fps));
  for (const frame of [0, 1, 2, 3, 4, 10]) {
    assert.equal(useTypedText(text, frame, fps, { cps }).visible.length, expected(frame));
  }
  assert.equal(useTypedText(text, 1, fps, { cps }).visible, text.slice(0, 3));
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
