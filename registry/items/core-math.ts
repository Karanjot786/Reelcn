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

/**
 * 0-1 progress from `frame`/`fps` over `duration` frames starting at `delay`, quantized by `motion`'s
 * step/jitter — the same time-quantization `tween` (in core.tsx) applies, reimplemented here without a
 * curve library since core-math.ts can't import core.tsx's Easing/spring helpers (core.tsx is JSX and
 * can't be loaded by node's native TypeScript loader; this file exists so node --test can). Linear only:
 * a variable-font axis move reads fine as a straight ramp, and it keeps this file dependency-free.
 */
function axisProgress(
  frame: number,
  { delay, duration, motion }: { delay: number; duration: number; motion: MotionPersonality },
): number {
  if (duration <= 0) return frame >= delay ? 1 : 0;
  const q = quantizeMotion(motion);
  const wobble =
    q.jitter > 0 ? Math.round((random(`axis-jitter-${Math.floor(frame / q.step)}`) - 0.5) * 2 * q.jitter * q.step) : 0;
  const f = q.step > 1 ? Math.floor((frame + wobble) / q.step) * q.step : frame;
  return clamp01((f - delay) / duration);
}

/**
 * A `font-variation-settings` fragment (`"wdth" <value>`) moving from `from` to `to` over `duration`
 * frames (default 0.6s, `useMotion`'s own enter-duration default) starting at `delay` (default 0),
 * shaped by `motion`'s quantized step/jitter so a variable-font axis move looks staged like every other
 * Phase 1 motion primitive (mono/Signal's Archivo width move is the only Phase 2 consumer).
 */
export function useVariableFontAxis(
  from: number,
  to: number,
  {
    fps,
    frame,
    motion = "snappy",
    delay = 0,
    duration,
  }: { fps: number; frame: number; motion?: MotionPersonality; delay?: number; duration?: number },
): string {
  const span = duration ?? Math.round(fps * 0.6);
  const t = axisProgress(frame, { delay, duration: span, motion });
  const value = from + (to - from) * t;
  return `"wdth" ${value.toFixed(2)}`;
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

/* ─────────────────────────── Transitions ─────────────────────────── */

/**
 * `d` shaped so the result is exactly 0 at `d=0` and exactly 1 at `d=1` (not merely close — a
 * `TransitionSeries` presentation stays mounted at `progress=0` outside its overlap, so a near-zero
 * residual like `sin(π)` is a real, visible artifact). `p` controls how sharp the punch is; the research's
 * whip pan uses `p≈3`.
 */
export function punchCurve(d: number, p: number): number {
  const clamped = clamp01(d);
  const a = clamped ** p;
  const b = (1 - clamped) ** p;
  return a + b === 0 ? 0 : a / (a + b);
}

/**
 * The cover/swap/reveal split every existing cover-style transition (`circle-burst`, `stripe-wipe`,
 * `shutter`, `tile-reveal`) hand-rolls inline. `cover` runs 0→1 over `[0, coverEnd]`, `reveal` runs 0→1
 * over `[revealStart, 1]`, `showsNext` flips at `swapAt`. Exactly 0 at `p=0` and exactly 1 at `p=1` for
 * both `cover` and `reveal` — the displace-zero contract.
 */
export function coverPhase(
  p: number,
  {
    coverEnd = 0.5,
    swapAt = coverEnd,
    revealStart = coverEnd,
  }: { coverEnd?: number; swapAt?: number; revealStart?: number } = {},
): { cover: number; reveal: number; showsNext: boolean } {
  const cover = coverEnd <= 0 ? 1 : clamp01(p / coverEnd);
  const reveal = revealStart >= 1 ? 0 : clamp01((p - revealStart) / (1 - revealStart));
  return { cover, reveal, showsNext: p >= swapAt };
}

/* ─────────────────────────────── 3D ───────────────────────────────── */

export type Vec3 = { x: number; y: number; z: number };
/** Row-major 4×4, 16 entries: `m[row*4+col]`. Transforms a column vector `[x,y,z,1]` as `M·v`. */
export type Mat4 = number[];

const vsub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const vcross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const vdot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const vnormalize = (v: Vec3): Vec3 => {
  const len = Math.sqrt(vdot(v, v)) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
};

/** Standard 4×4 matrix product, `a · b`. */
export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[row * 4 + k] * b[k * 4 + col];
      out[row * 4 + col] = sum;
    }
  }
  return out;
}

/** Right-handed view matrix: transforms a world point into the camera's own space (camera looks down -z). */
export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3 = { x: 0, y: 1, z: 0 }): Mat4 {
  const zAxis = vnormalize(vsub(eye, target));
  const xAxis = vnormalize(vcross(up, zAxis));
  const yAxis = vcross(zAxis, xAxis);
  return [
    xAxis.x,
    xAxis.y,
    xAxis.z,
    -vdot(xAxis, eye),
    yAxis.x,
    yAxis.y,
    yAxis.z,
    -vdot(yAxis, eye),
    zAxis.x,
    zAxis.y,
    zAxis.z,
    -vdot(zAxis, eye),
    0,
    0,
    0,
    1,
  ];
}

export type Quat = { x: number; y: number; z: number; w: number };

const quatNormalize = (q: Quat): Quat => {
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
};

/** Shortest-path spherical interpolation between two unit quaternions. Falls back to a normalized lerp
 * when they're nearly identical, where `sin(halfTheta)` would be too small to divide by safely. */
export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;
  let cosHalfTheta = a.x * bx + a.y * by + a.z * bz + a.w * bw;
  // Negating both signs of `b` picks the shorter rotational path (a quaternion and its negation
  // represent the same rotation, but interpolating naively between them can take the long way around).
  if (cosHalfTheta < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
    cosHalfTheta = -cosHalfTheta;
  }
  if (cosHalfTheta > 0.9995) {
    return quatNormalize({
      x: a.x + (bx - a.x) * t,
      y: a.y + (by - a.y) * t,
      z: a.z + (bz - a.z) * t,
      w: a.w + (bw - a.w) * t,
    });
  }
  const halfTheta = Math.acos(cosHalfTheta);
  const sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);
  const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
  const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
  return {
    x: a.x * ratioA + bx * ratioB,
    y: a.y * ratioA + by * ratioB,
    z: a.z * ratioA + bz * ratioB,
    w: a.w * ratioA + bw * ratioB,
  };
}

/** The rotation a camera at `eye` needs to look at `target`, as a unit quaternion (trace method). */
export function quatFromLookAt(eye: Vec3, target: Vec3, up: Vec3 = { x: 0, y: 1, z: 0 }): Quat {
  const zAxis = vnormalize(vsub(eye, target));
  const xAxis = vnormalize(vcross(up, zAxis));
  const yAxis = vcross(zAxis, xAxis);
  const m00 = xAxis.x;
  const m10 = xAxis.y;
  const m20 = xAxis.z;
  const m01 = yAxis.x;
  const m11 = yAxis.y;
  const m21 = yAxis.z;
  const m02 = zAxis.x;
  const m12 = zAxis.y;
  const m22 = zAxis.z;
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return quatNormalize({ w: 0.25 / s, x: (m21 - m12) * s, y: (m02 - m20) * s, z: (m10 - m01) * s });
  }
  if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    return quatNormalize({ w: (m21 - m12) / s, x: 0.25 * s, y: (m01 + m10) / s, z: (m02 + m20) / s });
  }
  if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    return quatNormalize({ w: (m02 - m20) / s, x: (m01 + m10) / s, y: 0.25 * s, z: (m12 + m21) / s });
  }
  const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
  return quatNormalize({ w: (m10 - m01) / s, x: (m02 + m20) / s, y: (m12 + m21) / s, z: 0.25 * s });
}

/**
 * Projects a world point through `viewMatrix` (from `mat4LookAt`) with a pinhole perspective: `fov` in
 * degrees, `aspect` = width/height. `x`/`y` are roughly `[-1, 1]` inside the frustum; `depth` is distance
 * in front of the camera along its view axis (negative or zero means behind the camera — callers should
 * skip drawing that child).
 */
export function projectPoint(
  point: Vec3,
  viewMatrix: Mat4,
  fov: number,
  aspect: number,
): { x: number; y: number; depth: number } {
  const m = viewMatrix;
  const vx = m[0] * point.x + m[1] * point.y + m[2] * point.z + m[3];
  const vy = m[4] * point.x + m[5] * point.y + m[6] * point.z + m[7];
  const vz = m[8] * point.x + m[9] * point.y + m[10] * point.z + m[11];
  const depth = -vz;
  const focal = 1 / Math.tan((fov * Math.PI) / 360);
  const safeDepth = Math.max(depth, 0.001);
  return { x: (vx * focal) / (safeDepth * aspect), y: (vy * focal) / safeDepth, depth };
}

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
