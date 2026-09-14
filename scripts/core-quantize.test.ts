import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors quantizeMotion and tween's quantization step from registry/items/core.tsx.
// core.tsx is JSX and cannot be imported by `node --test` (see scripts/core-settle.test.ts for the same convention).
type MotionPreset = "smooth" | "snappy" | "bouncy" | "gentle" | "linear" | "settle";
type MotionPersonality = MotionPreset | { preset: MotionPreset; step?: number; jitter?: number };

function quantizeMotion(m: MotionPersonality): { preset: MotionPreset; step: number; jitter: number } {
  if (typeof m === "string") return { preset: m, step: 1, jitter: 0 };
  return { preset: m.preset, step: m.step ?? 1, jitter: m.jitter ?? 0 };
}

test("a plain string normalizes to step:1, jitter:0", () => {
  assert.deepEqual(quantizeMotion("smooth"), { preset: "smooth", step: 1, jitter: 0 });
});

test("an object fills in missing step/jitter", () => {
  assert.deepEqual(quantizeMotion({ preset: "snappy" }), { preset: "snappy", step: 1, jitter: 0 });
  assert.deepEqual(quantizeMotion({ preset: "snappy", step: 3 }), { preset: "snappy", step: 3, jitter: 0 });
});

// Stand-in for remotion's seeded `random()` — deterministic (same seed -> same value) like the real
// export, not required to match its exact distribution.
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

// Mirrors tween's floor-snap + seeded-offset quantization of `frame`.
function quantizedFrame(frame: number, step: number, jitter: number, seed: string): number {
  const wobble =
    jitter > 0 ? Math.round((seededRandom(`${seed}-${Math.floor(frame / step)}`) - 0.5) * 2 * jitter * step) : 0;
  return step > 1 ? Math.floor((frame + wobble) / step) * step : frame;
}

// Mirrors tween's linear branch as a pure function of the quantized frame.
function linearTween(frame: number, duration: number, step = 1, jitter = 0, seed = "tween"): number {
  const f = quantizedFrame(frame, step, jitter, seed);
  return Math.min(Math.max(f / duration, 0), 1);
}

test("step:1 output equals unquantized tween output frame-for-frame", () => {
  for (let f = 0; f < 20; f++) {
    assert.equal(linearTween(f, 10, 1), linearTween(f, 10));
  }
});

test("step:3 output only changes value every 3rd frame", () => {
  const values = Array.from({ length: 9 }, (_, f) => quantizedFrame(f, 3, 0, "tween"));
  assert.equal(values[0], values[1]);
  assert.equal(values[1], values[2]);
  assert.notEqual(values[2], values[3]);
});

test("same seed/jitter reproduces identically across two calls", () => {
  const a = quantizedFrame(7, 3, 0.5, "s");
  const b = quantizedFrame(7, 3, 0.5, "s");
  assert.equal(a, b);
});
