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
