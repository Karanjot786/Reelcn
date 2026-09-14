import { strict as assert } from "node:assert";
import { test } from "node:test";
import { clamp01, graphemeInitial } from "../registry/items/core-math.ts";

test("clamp01 boundary values", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0), 0);
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(1), 1);
  assert.equal(clamp01(2), 1);
});

test("graphemeInitial keeps a whole emoji together", () => {
  assert.equal(graphemeInitial("👩‍🚀 Ada"), "👩‍🚀");
});

test("graphemeInitial handles a CJK name", () => {
  assert.equal(graphemeInitial("田中さん"), "田");
});

test("graphemeInitial keeps a combining mark with its base letter", () => {
  assert.equal(graphemeInitial("Áda"), "Á");
});

test("graphemeInitial on an empty string returns an empty string", () => {
  assert.equal(graphemeInitial(""), "");
});
