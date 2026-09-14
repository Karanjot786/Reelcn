import { strict as assert } from "node:assert";
import { test } from "node:test";
import { staggerDelay } from "../registry/items/core-math.ts";

// SceneClock is a thin context wrapper around staggerDelay: it shares one delayFor(index, count) closure over a
// fixed options object with every child that reads it via useSceneClock. This only needs to confirm that closure
// forwards its args to the real staggerDelay identically.
test("SceneClock's delayFor matches staggerDelay called directly with the same arguments", () => {
  const opts = { step: 5, order: "reverse" as const, shape: "compress" as const, seed: "scene" };
  const delayFor = (index: number, count: number) => staggerDelay(index, count, opts);
  for (let i = 0; i < 4; i++) assert.equal(delayFor(i, 4), staggerDelay(i, 4, opts));
});
