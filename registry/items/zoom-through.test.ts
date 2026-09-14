import assert from "node:assert/strict";
import { test } from "node:test";
import { coverPhase } from "./core-math.ts";

test("zoom-through's own displace values are exact at both transition boundaries", () => {
  const start = coverPhase(0);
  const end = coverPhase(1);
  assert.equal(start.cover, 0);
  assert.equal(end.reveal, 1);
});

test("at the midpoint, only one scene is showing (showsNext flips at swapAt)", () => {
  assert.equal(coverPhase(0.5).showsNext, true);
  assert.equal(coverPhase(0.49999).showsNext, false);
});
