// scripts/bar-chart-label-width.test.ts
import { strict as assert } from "node:assert";
import { test } from "node:test";

function labelWidth(
  measured: { ready: boolean; width: number },
  estimateChars: number,
  labelPx: number,
  padPx: number,
  cap: number,
): number {
  return Math.min((measured.ready ? measured.width : estimateChars * labelPx * 0.56) + padPx, cap);
}

test("falls back to the char estimate before the font is ready", () => {
  assert.equal(labelWidth({ ready: false, width: 999 }, 2, 26, 24, 1000), 2 * 26 * 0.56 + 24);
});

test("uses the real measured width once ready, even if it exceeds the old estimate", () => {
  const wide = labelWidth({ ready: true, width: 40 }, 2, 26, 24, 1000);
  const oldEstimate = 2 * 26 * 0.56 + 24;
  assert.ok(wide > oldEstimate, "measured width must be allowed to exceed the undershooting estimate");
});
