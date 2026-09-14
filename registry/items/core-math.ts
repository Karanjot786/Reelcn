/**
 * @title Core Math
 * @category lib
 * @description Pure, dependency-free math behind Core's motion and text helpers: motion quantization, stagger ordering, Catmull-Rom keyframe interpolation, the typing-reveal model, grapheme splitting and 0-1 clamping. No React, no DOM — safe to unit-test directly.
 * @tags math, stagger, keyframe, typing, grapheme, quantize
 * @example
 * const delay = staggerDelay(2, 5, { step: 4 }); // 8
 * const initial = graphemeInitial("👩‍🚀 Ada"); // "👩‍🚀"
 */
/// <reference lib="es2022.intl" />
import { random } from "remotion";

/* ─────────────────────────── Motion quantization ─────────────────────────── */

export type MotionPreset = "smooth" | "snappy" | "bouncy" | "gentle" | "linear" | "settle";

/** A plain preset, or a preset with time-quantization ("on twos"/"on threes") and seeded jitter. */
export type MotionPersonality = MotionPreset | { preset: MotionPreset; step?: number; jitter?: number };

/** Normalizes a `MotionPersonality` to its full, explicit shape. A plain string is `{ preset, step: 1, jitter: 0 }` — mathematically a no-op quantization. */
export function quantizeMotion(m: MotionPersonality): { preset: MotionPreset; step: number; jitter: number } {
  if (typeof m === "string") return { preset: m, step: 1, jitter: 0 };
  return { preset: m.preset, step: m.step ?? 1, jitter: m.jitter ?? 0 };
}

/* ──────────────────────────────── Stagger ─────────────────────────────── */

export type StaggerOrder = "forward" | "reverse" | "center" | "edges" | "random";
export type StaggerShape = "linear" | "compress" | "accelerando";

/** 0-indexed fire order for `index` among `count` items — `0` fires first. */
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
  // Seeded permutation: reproducible for a fixed (seed, count), independent of any other item's index.
  const ranked = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => random(`${seed}-order-${count}-${a}`) - random(`${seed}-order-${count}-${b}`),
  );
  return ranked.indexOf(index);
}

function shapedDelay(rank: number, step: number, shape: StaggerShape): number {
  if (shape === "linear") return rank * step;
  if (shape === "compress") return Math.round(step * rank ** 0.8);
  // accelerando: gaps between successive ranks grow, i.e. each step is bigger than the last.
  return Math.round(step * rank + 0.1 * step * rank * (rank - 1));
}

/**
 * Frame offset for item `index` of `count`, honoring a fire `order` and a delay `shape`. `staggerDelay(i, n, {
 * step, order: "forward", shape: "linear", jitter: 0 })` equals `index * step` exactly, so migrating an existing
 * `index * step` call site is a safe drop-in.
 */
export function staggerDelay(
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
  const wobble = jitter > 0 ? Math.round((random(`${seed}-jitter-${index}`) - 0.5) * 2 * jitter * step) : 0;
  return Math.max(0, base + wobble);
}

/* ───────────────────────────────── Paths ───────────────────────────────── */

/** Catmull-Rom spline through four control points, evaluated at `t` in [0, 1] between `p1` and `p2`. */
export function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/* ────────────────────────────── Text ────────────────────────────── */

// Locale is pinned (not undefined) because grapheme segmentation is locale-independent per UAX #29,
// and a fixed locale satisfies the determinism lint rule in registry/tools/check-determinism.ts.
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en-US", { granularity: "grapheme" }) : null;

/** Split into user-perceived characters, so emoji and accents never break apart. */
export const graphemes = (text: string) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);

/** Clamp to 0-1. */
export const clamp01 = (n: number): number => Math.min(Math.max(n, 0), 1);

/** First user-perceived character of `name`, safe for emoji, CJK and combining marks (`graphemes` already handles the segmentation). */
export const graphemeInitial = (name: string): string => graphemes(name)[0] ?? "";

/* ───────────────────────────────── Typing ──────────────────────────────── */

export type TypingModel = {
  /** Picks the burst/typo randomness. The same seed types identically on every machine. */
  seed?: string;
  /** Characters per second at the model's default burstiness. */
  cps?: number;
  /** 0-1. Adds a small seeded per-character speed variance around `cps`. 0 (default) types at a constant rate. */
  burstiness?: number;
  /** Extra frames held after `. , ! ? ; :`. 0 (default) adds no rest. */
  punctuationRestFrames?: number;
  /** 0-1 chance per character of a wrong glyph and a backspace before the real one. 0 (default) never fires. */
  typoRate?: number;
};

const PUNCTUATION = /[.,!?;:]/;

/**
 * `fullText` typed out at `frame`/`fps`, with `model`'s burst/typo/rest shaping layered on a constant-cps base.
 * Frame/fps are plain arguments (not read via a hook), so this is safe to call per-row inside a list.
 * `charFrames` is intentionally allowed below 1: when `cps` exceeds `fps`, several characters must land in the
 * same frame to keep the reveal rate honest, matching the pre-quantization `floor(elapsed * cps / fps)` model.
 */
export function useTypedText(
  fullText: string,
  frame: number,
  fps: number,
  model: TypingModel = {},
): { visible: string; caretOn: boolean; done: boolean } {
  const { seed = "typed", cps = 18, burstiness = 0, punctuationRestFrames = 0, typoRate = 0 } = model;
  const chars = graphemes(fullText);
  let t = 0;
  let shown = 0;
  for (let i = 0; i < chars.length; i++) {
    const jitter = burstiness > 0 ? 1 + burstiness * (random(`${seed}-${i}`) - 0.5) : 1;
    const charFrames = fps / (cps * jitter);
    if (typoRate > 0 && random(`${seed}-typo-${i}`) < typoRate) t += charFrames * 2; // one wrong glyph, then a backspace
    t += charFrames;
    if (PUNCTUATION.test(chars[i])) t += punctuationRestFrames;
    if (frame < t) break;
    shown = i + 1;
  }
  const done = shown === chars.length;
  const caretOn = !done || Math.floor(Math.abs(frame) / Math.max(1, Math.round(fps / 2))) % 2 === 0;
  return { visible: chars.slice(0, shown).join(""), caretOn, done };
}
