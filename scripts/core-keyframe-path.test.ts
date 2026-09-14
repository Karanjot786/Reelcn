import { strict as assert } from "node:assert";
import { test } from "node:test";
import { catmullRom } from "../registry/items/core-math.ts";

test("t=0 returns p1 exactly (a keyframe's own value)", () => {
  assert.equal(catmullRom(0, 10, 20, 30, 0), 10);
});

test("t=1 returns p2 exactly (the next keyframe's own value)", () => {
  assert.equal(catmullRom(0, 10, 20, 30, 1), 20);
});
