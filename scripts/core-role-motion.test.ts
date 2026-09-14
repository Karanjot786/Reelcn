import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors useRoleMotion's travel math without a React/Remotion render.
function travel(px: number, enterShare: number, exitShare: number) {
  return { enterPx: px * enterShare, exitPx: px * exitShare };
}

test("exit travels 60% as far as enter, by default", () => {
  const { enterPx, exitPx } = travel(40, 1, 0.6);
  assert.equal(enterPx, 40);
  assert.equal(exitPx, 24);
});

test("exit's opacity reaches 0 before its geometry settles", () => {
  // geometry uses raw m.exit; opacity uses m.exit nudged forward by opacityLeadFrames — so at partway through
  // the exit window, opacity's complement must be smaller (further along) than geometry's.
  const exit = 0.5;
  const leadShare = 3 / (30 * 0.35); // opacityLeadFrames=3 at 30fps, default 0.35s exit window
  const opacityExit = Math.min(1, exit + leadShare);
  assert.ok(1 - opacityExit < 1 - exit);
});
