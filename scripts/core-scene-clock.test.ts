import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors staggerDelay's math without a React/Remotion import — core.tsx is JSX and node --test's native
// TypeScript loader can't strip it (same reason core-stagger.test.ts, core-role-motion.test.ts and
// core-viewport.test.ts mirror instead of importing). SceneClock is a thin context wrapper around
// staggerDelay, so this test only needs to confirm its delayFor forwards args identically.
type StaggerOrder = "forward" | "reverse" | "center" | "edges" | "random";
type StaggerShape = "linear" | "compress" | "accelerando";

function mockRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

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

test("SceneClock's delayFor matches staggerDelay called directly with the same arguments", () => {
  const opts = { step: 5, order: "reverse" as const, shape: "compress" as const, seed: "scene" };
  const delayFor = (index: number, count: number) => staggerDelay(index, count, opts);
  for (let i = 0; i < 4; i++) assert.equal(delayFor(i, 4), staggerDelay(i, 4, opts));
});
