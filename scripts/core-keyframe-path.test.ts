import { strict as assert } from "node:assert";
import { test } from "node:test";

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

test("t=0 returns p1 exactly (a keyframe's own value)", () => {
  assert.equal(catmullRom(0, 10, 20, 30, 0), 10);
});

test("t=1 returns p2 exactly (the next keyframe's own value)", () => {
  assert.equal(catmullRom(0, 10, 20, 30, 1), 20);
});
