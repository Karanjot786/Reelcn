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

test("mat4LookAt returns the identity matrix when eye equals target", () => {
  const m = mat4LookAt({ x: 3, y: -1, z: 5 }, { x: 3, y: -1, z: 5 });
  assert.deepEqual(
    m.map((n) => Math.round(n * 1e6) / 1e6),
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  );
});

test("mat4LookAt returns identity at the world origin too (eye === target === {0,0,0})", () => {
  const m = mat4LookAt({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  assert.deepEqual(m, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
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

import { geometricCadence } from "./core-math.ts";

test("geometricCadence starts at 0", () => {
  assert.equal(geometricCadence(0, 6, 0.82), 0);
});

test("geometricCadence's gaps strictly shrink (an accelerando, not a constant stagger)", () => {
  const t0 = geometricCadence(0, 6, 0.82);
  const t1 = geometricCadence(1, 6, 0.82);
  const t2 = geometricCadence(2, 6, 0.82);
  const t3 = geometricCadence(3, 6, 0.82);
  const gap1 = t1 - t0;
  const gap2 = t2 - t1;
  const gap3 = t3 - t2;
  assert.ok(gap2 < gap1, `expected ${gap2} < ${gap1}`);
  assert.ok(gap3 < gap2, `expected ${gap3} < ${gap2}`);
});

import { matchGraphemes } from "./core-math.ts";

test("matchGraphemes keeps a shared letter's identity instead of fading and re-appearing", () => {
  const from = "Build".split("");
  const to = "Ship".split("");
  const pairs = matchGraphemes(from, to);
  const matched = pairs.filter((p) => p.fromIndex >= 0 && p.toIndex >= 0);
  // "i" is the only letter shared between "Build" and "Ship" (case-sensitive as written) at index 2 in
  // both words — it must be matched, not treated as an exit+enter pair.
  assert.ok(
    matched.some((p) => p.fromIndex === 2 && p.toIndex === 2),
    JSON.stringify(pairs),
  );
});

test("matchGraphemes accounts for every character exactly once", () => {
  const from = "cat".split("");
  const to = "cot".split("");
  const pairs = matchGraphemes(from, to);
  const froms = pairs
    .filter((p) => p.fromIndex >= 0)
    .map((p) => p.fromIndex)
    .sort();
  const tos = pairs
    .filter((p) => p.toIndex >= 0)
    .map((p) => p.toIndex)
    .sort();
  assert.deepEqual(froms, [0, 1, 2]);
  assert.deepEqual(tos, [0, 1, 2]);
});

import { anchorId } from "./core-math.ts";

test("anchorId: a bare base id has no child suffix", () => {
  assert.equal(anchorId("email"), "email");
});

test("anchorId: a numeric child becomes a list-index suffix", () => {
  assert.equal(anchorId("list", 2), "list.item[2]");
});

test("anchorId: a string child becomes a dotted suffix", () => {
  assert.equal(anchorId("email", "caret"), "email.caret");
  assert.equal(anchorId("confirm", "submit"), "confirm.submit");
});

import { anchorToContentPercent, requireAnchor } from "./core-math.ts";

test("requireAnchor: returns the rect when the id is present", () => {
  const anchors = { submit: { x: 10, y: 20, width: 30, height: 8 } };
  assert.deepEqual(requireAnchor(anchors, "submit", "Test"), anchors.submit);
});

test("requireAnchor: throws, naming the item and the missing id", () => {
  assert.throws(() => requireAnchor({}, "submit", "Cursor"), /Cursor.*"submit"/);
});

test("anchorToContentPercent: identity contentBox (full-canvas ScreenZoom) is a no-op", () => {
  const rect = { x: 40, y: 30, width: 20, height: 10 };
  const identity = { x: 0, y: 0, width: 100, height: 100 };
  assert.deepEqual(anchorToContentPercent(rect, identity), rect);
});

test("anchorToContentPercent: a nested ScreenZoom's contentBox rescales the anchor into the wrapper's own %", () => {
  // A BrowserWindow occupying the right half of the canvas (x: 50-100%), with a button anchored at
  // canvas-x 75% (the middle of that half) — content-relative, that's 50% of the wrapper's own width.
  const rect = { x: 62.5, y: 40, width: 25, height: 10 };
  const contentBox = { x: 50, y: 0, width: 50, height: 100 };
  const content = anchorToContentPercent(rect, contentBox);
  assert.equal(content.x, 25); // (62.5 - 50) / 50 * 100
  assert.equal(content.width, 50); // 25 / 50 * 100
  assert.equal(content.y, 40); // content box's own top is 0, height 100: unchanged
});

import { type Step, stepsDuration } from "./core-math.ts";

test("stepsDuration: last step's `at` (seconds) converted to frames, plus a hold budget", () => {
  const steps: Step<string>[] = [
    { at: 0, state: "idle" },
    { at: 2, state: "done" },
  ];
  assert.equal(stepsDuration(steps, 15, 30), 75); // 2s * 30fps = 60, + 15 hold frames
});

test("stepsDuration: no steps is just the hold budget", () => {
  assert.equal(stepsDuration([], 15, 30), 15);
});

test("stepsDuration: unordered `at` values still use the last array entry, not the max", () => {
  // Matches useKeyframeState's own fold rule (array order, not sorted) — an author who writes steps out
  // of order gets a duration that matches what actually plays last, not a silently-reordered one.
  const steps: Step<string>[] = [
    { at: 3, state: "a" },
    { at: 1, state: "b" },
  ];
  assert.equal(stepsDuration(steps, 0, 30), 30); // last entry is at=1, not the max at=3
});

import { proximityWeight } from "./core-math.ts";

test("proximityWeight: exactly 1 when the row is the offset itself", () => {
  assert.equal(proximityWeight(2, 2), 1);
});

test("proximityWeight: 0 exactly one row away", () => {
  assert.equal(proximityWeight(2, 3), 0);
  assert.equal(proximityWeight(2, 1), 0);
});

test("proximityWeight: symmetric — same distance either direction gives the same weight", () => {
  assert.equal(proximityWeight(2, 2.5), proximityWeight(2, 1.5));
});

test("proximityWeight: clamped at 0 beyond one row away, never negative", () => {
  assert.equal(proximityWeight(0, 5), 0);
});

import { type Orientation, stackLayout } from "./core-math.ts";

const SAFE_LANDSCAPE = { x: 6, top: 8, bottom: 8 };
const SAFE_PORTRAIT = { x: 7, top: 12, bottom: 20 };

test("stackLayout: places sit inside the safe zone, in every orientation", () => {
  for (const [orientation, safe] of [
    ["landscape", SAFE_LANDSCAPE],
    ["portrait", SAFE_PORTRAIT],
    ["square", SAFE_LANDSCAPE],
  ] as [Orientation, typeof SAFE_LANDSCAPE][]) {
    for (let count = 1; count <= 6; count++) {
      const places = stackLayout(count, orientation, safe);
      assert.equal(places.length, count);
      for (const p of places) {
        assert.ok(p.y >= safe.top, `${orientation} count=${count}: ${p.y} >= ${safe.top}`);
        assert.ok(p.y <= 100 - safe.bottom, `${orientation} count=${count}: ${p.y} <= ${100 - safe.bottom}`);
        assert.equal(p.x, 50);
      }
    }
  }
});

test("stackLayout: no two placed rows collide — strictly increasing, evenly spaced", () => {
  const places = stackLayout(4, "landscape", SAFE_LANDSCAPE);
  for (let i = 1; i < places.length; i++) {
    assert.ok(places[i].y > places[i - 1].y, "rows must be strictly increasing");
  }
  const gap0 = places[1].y - places[0].y;
  for (let i = 2; i < places.length; i++) {
    assert.ok(Math.abs(places[i].y - places[i - 1].y - gap0) < 1e-9, "even spacing");
  }
});

test("stackLayout: portrait spacing is tighter than landscape for the same count", () => {
  const landscape = stackLayout(3, "landscape", SAFE_LANDSCAPE);
  const portrait = stackLayout(3, "portrait", SAFE_PORTRAIT);
  const gapLandscape = landscape[1].y - landscape[0].y;
  const gapPortrait = portrait[1].y - portrait[0].y;
  assert.ok(gapPortrait < gapLandscape);
});

test("stackLayout: a single component centers itself in the safe zone", () => {
  const [p] = stackLayout(1, "landscape", SAFE_LANDSCAPE);
  assert.equal(p.y, (SAFE_LANDSCAPE.top + (100 - SAFE_LANDSCAPE.bottom)) / 2);
});

import { redactRectBudget } from "./core-math.ts";

test("redactRectBudget: 8 rects is fine (the reference implementation's own limit)", () => {
  assert.doesNotThrow(() => redactRectBudget(8));
});

test("redactRectBudget: 9 rects throws", () => {
  assert.throws(() => redactRectBudget(9));
});

import { occupancy, stackOffset } from "./core-math.ts";

test("occupancy: fully entered and not yet leaving is 1", () => {
  assert.equal(occupancy(1, 0), 1);
});

test("occupancy: fully left is 0 regardless of enter", () => {
  assert.equal(occupancy(1, 1), 0);
});

test("occupancy: half-entered, not leaving, is 0.5", () => {
  assert.equal(occupancy(0.5, 0), 0.5);
});

test("stackOffset: a 3-toast fixture with staggered enter/leave — offsets sum only the toasts above", () => {
  const items = [
    { occupancy: occupancy(1, 0), height: 100 }, // toast 0: fully in
    { occupancy: occupancy(1, 0), height: 100 }, // toast 1: fully in
    { occupancy: occupancy(0.5, 0), height: 100 }, // toast 2: half entered
  ];
  assert.equal(stackOffset(items, 0), 0);
  assert.equal(stackOffset(items, 1), 100); // one full toast above
  assert.equal(stackOffset(items, 2), 200); // two full toasts above
});

test("stackOffset: a toast that has left contributes nothing to slots below it", () => {
  const items = [
    { occupancy: occupancy(1, 1), height: 100 }, // toast 0: fully left, occupancy 0
    { occupancy: occupancy(1, 0), height: 100 }, // toast 1: fully in
  ];
  assert.equal(stackOffset(items, 1), 0); // toast 0 contributes nothing — the stack closed up
});

import { checklistDuration, checklistSchedule } from "./core-math.ts";

test("checklistSchedule: arrival frames are monotonic, non-decreasing", () => {
  const schedule = checklistSchedule([1, 2, 3, 4, 5], 5);
  for (let i = 1; i < schedule.length; i++) assert.ok(schedule[i] >= schedule[i - 1]);
});

test("checklistSchedule: the first item arrives at frame 0", () => {
  assert.equal(checklistSchedule([1, 2, 3])[0], 0);
});

test("checklistSchedule: gaps shorten as the list grows (accelerando, M2)", () => {
  const schedule = checklistSchedule([1, 2, 3, 4, 5], 5);
  const firstGap = schedule[1] - schedule[0];
  const lastGap = schedule[4] - schedule[3];
  assert.ok(lastGap <= firstGap);
});

test("checklistDuration: at least covers the last item's own arrival", () => {
  const items = [1, 2, 3];
  const schedule = checklistSchedule(items);
  assert.ok(checklistDuration(items) >= schedule[schedule.length - 1]);
});

test("checklistDuration: an empty list is just the hold budget, not negative", () => {
  assert.ok(checklistDuration([]) >= 0);
});
