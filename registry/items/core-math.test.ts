import assert from "node:assert/strict";
import { test } from "node:test";
import { useVariableFontAxis } from "./core-math.ts";

test("useVariableFontAxis starts at `from` and ends at `to`", () => {
  const start = useVariableFontAxis(125, 62, { fps: 30, frame: 0, duration: 18 });
  const end = useVariableFontAxis(125, 62, { fps: 30, frame: 18, duration: 18 });
  assert.equal(start, '"wdth" 125.00');
  assert.equal(end, '"wdth" 62.00');
});

test("useVariableFontAxis is monotonic between from and to with a linear motion preset", () => {
  const at = (frame: number) =>
    Number(useVariableFontAxis(0, 100, { fps: 30, frame, duration: 30, motion: "linear" }).split(" ")[1]);
  const a = at(10);
  const b = at(20);
  assert.ok(a < b, `expected ${a} < ${b}`);
  assert.ok(a >= 0 && b <= 100);
});

test("useVariableFontAxis respects delay: no movement before it starts", () => {
  const value = useVariableFontAxis(125, 62, { fps: 30, frame: 5, delay: 10, duration: 18 });
  assert.equal(value, '"wdth" 125.00');
});

import { coverPhase, punchCurve } from "./core-math.ts";

test("punchCurve is exactly 0 at d=0 and exactly 1 at d=1 (displace-zero contract)", () => {
  assert.equal(punchCurve(0, 3), 0);
  assert.equal(punchCurve(1, 3), 1);
});

test("punchCurve is 0.5 at the midpoint regardless of exponent", () => {
  assert.equal(punchCurve(0.5, 3), 0.5);
  assert.equal(punchCurve(0.5, 1.7), 0.5);
});

test("coverPhase is exactly 0/0/false at p=0 and exactly 1/1/true at p=1", () => {
  const start = coverPhase(0);
  assert.equal(start.cover, 0);
  assert.equal(start.reveal, 0);
  assert.equal(start.showsNext, false);
  const end = coverPhase(1);
  assert.equal(end.cover, 1);
  assert.equal(end.reveal, 1);
  assert.equal(end.showsNext, true);
});

test("coverPhase swaps at swapAt", () => {
  assert.equal(coverPhase(0.4, { swapAt: 0.5 }).showsNext, false);
  assert.equal(coverPhase(0.5, { swapAt: 0.5 }).showsNext, true);
});
