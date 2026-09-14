import assert from "node:assert/strict";
import { test } from "node:test";
import { coverPhase } from "./core-math.ts";

test("organic-dissolve's reveal amount is exactly 1/0 at the transition boundaries", () => {
  // exiting: revealAmount = 1 - cover
  assert.equal(1 - coverPhase(0).cover, 1);
  assert.equal(1 - coverPhase(1).cover, 0);
  // entering: revealAmount = reveal
  assert.equal(coverPhase(0).reveal, 0);
  assert.equal(coverPhase(1).reveal, 1);
});

test("seedToNumber-style hashing is deterministic (same seed, same result)", () => {
  const hash = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000;
    return Math.abs(h);
  };
  assert.equal(hash("scene-1"), hash("scene-1"));
  assert.notEqual(hash("scene-1"), hash("scene-2"));
});
