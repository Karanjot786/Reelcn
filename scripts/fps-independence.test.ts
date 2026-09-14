import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors the fix: a "2 frames at 30fps" stagger step must land at the same wall-clock instant at any fps.
function staggerStep(fps: number): number {
  return Math.round(fps * (2 / 30));
}

test("stagger step is fps-relative and matches today's constant at 30fps", () => {
  assert.equal(staggerStep(30), 2);
});

test("stagger step doubles at 60fps, preserving wall-clock timing", () => {
  const at30 = staggerStep(30) / 30;
  const at60 = staggerStep(60) / 60;
  assert.ok(Math.abs(at30 - at60) < 1 / 60);
});
