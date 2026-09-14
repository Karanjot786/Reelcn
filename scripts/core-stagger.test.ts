import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors staggerDelay's math without a React/Remotion import — core.tsx is JSX and node --test's native
// TypeScript loader can't strip it (same reason core-role-motion.test.ts and core-viewport.test.ts mirror
// instead of importing). `mockRandom` stands in for remotion's `random(seed)`: any deterministic,
// string-seeded [0, 1) function satisfies these tests, since they only assert reproducibility and shape,
// never remotion's actual sequence.
function mockRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

type StaggerOrder = "forward" | "reverse" | "center" | "edges" | "random";
type StaggerShape = "linear" | "compress" | "accelerando";

function fireRank(index: number, count: number, order: StaggerOrder, seed: string): number {
  if (count <= 1) return 0;
  if (order === "forward") return index;
  if (order === "reverse") return count - 1 - index;
  if (order === "center" || order === "edges") {
    const mid = (count - 1) / 2;
    const key = (i: number) => (order === "center" ? Math.abs(i - mid) : -Math.abs(i - mid));
    const ranked = Array.from({ length: count }, (_, i) => i).sort((a, b) => key(a) - key(b) || a - b);
    return ranked.indexOf(index);
  }
  const ranked = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => mockRandom(`${seed}-order-${count}-${a}`) - mockRandom(`${seed}-order-${count}-${b}`),
  );
  return ranked.indexOf(index);
}

function shapedDelay(rank: number, step: number, shape: StaggerShape): number {
  if (shape === "linear") return rank * step;
  if (shape === "compress") return Math.round(step * rank ** 0.8);
  return Math.round(step * rank + 0.1 * step * rank * (rank - 1));
}

function staggerDelay(
  index: number,
  count: number,
  {
    step,
    order = "forward",
    shape = "linear",
    seed = "stagger",
    jitter = 0,
  }: {
    step: number;
    order?: StaggerOrder;
    shape?: StaggerShape;
    seed?: string;
    jitter?: number;
  },
): number {
  const rank = fireRank(index, count, order, seed);
  const base = shapedDelay(rank, step, shape);
  const wobble = jitter > 0 ? Math.round((mockRandom(`${seed}-jitter-${index}`) - 0.5) * 2 * jitter * step) : 0;
  return Math.max(0, base + wobble);
}

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
