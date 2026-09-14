// registry/items/core-stroke.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { strokeWidthProfile } from "./core-stroke.ts";

test("strokeWidthProfile peaks near the middle and tapers at both ends", () => {
  const start = strokeWidthProfile(0, "seed");
  const mid = strokeWidthProfile(0.5, "seed");
  const end = strokeWidthProfile(1, "seed");
  assert.ok(mid > start, `mid ${mid} should exceed start ${start}`);
  assert.ok(mid > end, `mid ${mid} should exceed end ${end}`);
});

test("strokeWidthProfile is deterministic for a fixed seed", () => {
  assert.equal(strokeWidthProfile(0.3, "arrow-1"), strokeWidthProfile(0.3, "arrow-1"));
});

test("strokeWidthProfile differs across seeds (bristle irregularity reads as hand-drawn, not identical every time)", () => {
  const a = strokeWidthProfile(0.3, "seed-a");
  const b = strokeWidthProfile(0.3, "seed-b");
  assert.notEqual(a, b);
});
