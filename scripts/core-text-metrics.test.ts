import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors fontFaceReady's weight-range check without a DOM.
function weightCovers(range: string, weight: number): boolean {
  const parts = range.split(" ").map(Number);
  return parts[0] <= weight && weight <= parts[parts.length - 1];
}

test("a single-weight face covers only its own weight", () => {
  assert.equal(weightCovers("400 400", 400), true);
  assert.equal(weightCovers("400 400", 700), false);
});

test("a variable-weight face covers its whole range", () => {
  assert.equal(weightCovers("400 800", 600), true);
  assert.equal(weightCovers("400 800", 900), false);
});
