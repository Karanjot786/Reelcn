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

import { mat4LookAt, mat4Multiply, projectPoint, quatFromLookAt, quatSlerp } from "./core-math.ts";

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

test("mat4Multiply(identity, M) === M", () => {
  const m = [2, 0, 0, 5, 0, 3, 0, 6, 0, 0, 4, 7, 0, 0, 0, 1];
  const result = mat4Multiply(IDENTITY, m);
  for (let i = 0; i < 16; i++) assert.ok(Math.abs(result[i] - m[i]) < 1e-9, `index ${i}`);
});

test("quatSlerp(q, q, 0.5) === q for a unit quaternion", () => {
  const q = quatFromLookAt({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 0 });
  const mid = quatSlerp(q, q, 0.5);
  assert.ok(Math.abs(mid.x - q.x) < 1e-9);
  assert.ok(Math.abs(mid.y - q.y) < 1e-9);
  assert.ok(Math.abs(mid.z - q.z) < 1e-9);
  assert.ok(Math.abs(mid.w - q.w) < 1e-9);
});

test("golden projection: a point straight ahead of the camera projects to x=0, y=0", () => {
  const view = mat4LookAt({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 0 });
  const projected = projectPoint({ x: 0, y: 0, z: 0 }, view, 50, 1);
  assert.ok(Math.abs(projected.x) < 1e-9);
  assert.ok(Math.abs(projected.y) < 1e-9);
  assert.ok(Math.abs(projected.depth - 5) < 1e-9, `expected depth 5, got ${projected.depth}`);
});

test("golden projection: a point to the camera's right projects to positive x", () => {
  const view = mat4LookAt({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 0 });
  const projected = projectPoint({ x: 1, y: 0, z: 0 }, view, 50, 1);
  assert.ok(projected.x > 0, `expected positive x, got ${projected.x}`);
});

import { lookAtOffset } from "./core-math.ts";

test("lookAtOffset centers the target when zoom is 1 and target is already centered", () => {
  const offset = lookAtOffset({ x: 0.5, y: 0.5 }, 1, { width: 1000, height: 1000 });
  assert.equal(offset.x, 0);
  assert.equal(offset.y, 0);
});

test("lookAtOffset scales the correction with zoom", () => {
  const offset = lookAtOffset({ x: 0.5, y: 0.5 }, 2, { width: 1000, height: 1000 });
  assert.equal(offset.x, -500);
  assert.equal(offset.y, -500);
});

test("lookAtOffset moves off-center targets toward frame center", () => {
  const offset = lookAtOffset({ x: 0.8, y: 0.2 }, 1, { width: 1000, height: 1000 });
  // target px = (800, 200); center = (500, 500); offset = center - zoom*targetPx
  assert.equal(offset.x, -300);
  assert.equal(offset.y, 300);
});
