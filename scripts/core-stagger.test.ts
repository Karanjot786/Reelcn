import { strict as assert } from "node:assert";
import { test } from "node:test";
import { staggerDelay } from "../registry/items/core-math.ts";

test("forward + linear + no jitter equals index * step exactly", () => {
  for (let i = 0; i < 5; i++) assert.equal(staggerDelay(i, 5, { step: 4 }), i * 4);
});

test("reverse fires the last index first", () => {
  const delays = [0, 1, 2, 3].map((i) => staggerDelay(i, 4, { step: 10, order: "reverse" }));
  assert.deepEqual(delays, [30, 20, 10, 0]);
});

test("center fires the middle indices first", () => {
  const delays = [0, 1, 2, 3, 4].map((i) => staggerDelay(i, 5, { step: 10, order: "center" }));
  assert.deepEqual(delays, [30, 10, 0, 20, 40]);
});

test("edges fires the outer indices first", () => {
  const delays = [0, 1, 2, 3, 4].map((i) => staggerDelay(i, 5, { step: 10, order: "edges" }));
  assert.deepEqual(delays, [0, 20, 40, 30, 10]);
});

test("random order is reproducible for a fixed seed and count", () => {
  const a = [0, 1, 2, 3].map((i) => staggerDelay(i, 4, { step: 5, order: "random", seed: "x" }));
  const b = [0, 1, 2, 3].map((i) => staggerDelay(i, 4, { step: 5, order: "random", seed: "x" }));
  assert.deepEqual(a, b);
});

test("compress follows rank^0.8", () => {
  const step = 10;
  for (let rank = 0; rank < 6; rank++) {
    assert.equal(staggerDelay(rank, 6, { step, shape: "compress" }), Math.round(step * rank ** 0.8));
  }
});

test("accelerando's successive deltas increase", () => {
  const delays = [0, 1, 2, 3, 4].map((i) => staggerDelay(i, 5, { step: 6, shape: "accelerando" }));
  const deltas = delays.slice(1).map((d, i) => d - delays[i]);
  for (let i = 1; i < deltas.length; i++) assert.ok(deltas[i] >= deltas[i - 1]);
});

test("same (index, count, seed) always returns the same value", () => {
  const a = staggerDelay(2, 7, { step: 3, order: "random", shape: "accelerando", jitter: 0.5, seed: "s" });
  const b = staggerDelay(2, 7, { step: 3, order: "random", shape: "accelerando", jitter: 0.5, seed: "s" });
  assert.equal(a, b);
});
