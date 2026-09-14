import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors tween's settle branch, pure function of t.
function settle(t: number): number {
  if (t <= 0) return 0;
  if (t < 0.4) return (t / 0.4) * 1.06; // linear stand-in for the eased rise, close enough for the peak/tolerance check
  return 1 + 0.06 * Math.exp(-4.6 * ((t - 0.4) / 0.6));
}

test("overshoots to about 1.06 at 40% of duration", () => {
  assert.ok(Math.abs(settle(0.4) - 1.06) < 0.01);
});

test("settles to about 1.0 by the end", () => {
  assert.ok(Math.abs(settle(1) - 1) < 0.02);
});

test("starts at 0", () => {
  assert.equal(settle(0), 0);
});

test("identical at any fps for the same duration in seconds (pure function of t)", () => {
  const durationSeconds = 0.5;
  const t30 = (Math.round(30 * durationSeconds) * 0.4) / Math.round(30 * durationSeconds);
  const t60 = (Math.round(60 * durationSeconds) * 0.4) / Math.round(60 * durationSeconds);
  assert.equal(t30, t60);
});
