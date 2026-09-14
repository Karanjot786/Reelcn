import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors useLoop's math without a React render.
function loopFrame(frame: number, durationInFrames: number, holdFrames = 0): number {
  const cycle = Math.max(1, durationInFrames + holdFrames);
  return Math.min(frame % cycle, durationInFrames - 1);
}

test("wraps seamlessly: the frame after the last hold frame is 0, matching frame 0's pose", () => {
  const duration = 10;
  const hold = 3;
  const lastHoldFrame = loopFrame(duration + hold - 1, duration, hold);
  const firstFrameNextCycle = loopFrame(duration + hold, duration, hold);
  assert.equal(lastHoldFrame, duration - 1);
  assert.equal(firstFrameNextCycle, 0);
});

test("holds the final content frame during the hold window", () => {
  const duration = 10;
  const hold = 3;
  assert.equal(loopFrame(duration, duration, hold), duration - 1);
  assert.equal(loopFrame(duration + 1, duration, hold), duration - 1);
});
