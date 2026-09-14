import assert from "node:assert/strict";
import { test } from "node:test";
import { punchCurve } from "./core-math.ts";

test("whip-pan's punch exponent is exactly 0/1 at the transition boundaries", () => {
  assert.equal(punchCurve(0, 3), 0);
  assert.equal(punchCurve(1, 3), 1);
});
