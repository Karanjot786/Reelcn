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

/**
 * Geometric accelerando: `t_i = gap·(1-aⁱ)/(1-a)` for `a = accel < 1`, so each successive delay is
 * shorter than the last — satisfies M2 ("speed comes from acceleration, never linear motion") directly.
 * Distinct from `staggerDelay`'s `accelerando` shape (quadratic-ish), kept as its own function so the
 * research's exact geometric formula is reproducible, not approximated by bending the existing shape.
 */
export function geometricCadence(i: number, gap: number, accel: number): number {
  if (accel >= 1) return gap * i;
  return (gap * (1 - accel ** i)) / (1 - accel);
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

/** A kit component's placed rect, % of canvas, top-left origin — the same shape `CalloutRect` already uses. */
export type AnchorRect = { x: number; y: number; width: number; height: number };

/**
 * Builds a composite kit component's child anchor id: a numeric `child` is a list index
 * (`anchorId("list", 2)` → `"list.item[2]"`), a string `child` is a dotted suffix
 * (`anchorId("email", "caret")` → `"email.caret"`), and no `child` returns `base` unchanged.
 */
export function anchorId(base: string, child?: string | number): string {
  if (child === undefined) return base;
  return typeof child === "number" ? `${base}.item[${child}]` : `${base}.${child}`;
}

/** A kit component's center, % of canvas (0-100 on each axis) — the one center-origin convention in the
 * UI-sim kit; `AnchorRect` stays top-left-origin. */
export type Place = { x: number; y: number };

/** One named visual state a kit component enters at `at` seconds. `type`/`click` are read by the `ui`
 * scene (Task 9) when it splits its own `steps` per component; kit components other than `input`/`button`
 * ignore them. */
export type Step<S> = { at: number; state?: S; type?: string; click?: boolean };

/** Last step's `at` (seconds), converted to frames, plus a hold budget — the content-derived duration
 * every kit item's `@duration data-driven` and the `ui` scene (Task 9) both use. */
export function stepsDuration(steps: Step<unknown>[], holdFrames: number, fps: number): number {
  if (steps.length === 0) return holdFrames;
  const last = steps[steps.length - 1];
  return Math.round(last.at * fps) + holdFrames;
}

/** Continuous highlight blend: 1 at the row itself, fading linearly to 0 one row away in either direction. */
export function proximityWeight(i: number, offset: number): number {
  return clamp01(1 - Math.abs(i - offset));
}

/** The three canvas shapes `useViewport()` reports — duplicated here (not imported from `core.tsx`, which
 * is JSX and can't be loaded by `node --test`) since it's a one-line, dependency-free union. */
export type Orientation = "landscape" | "portrait" | "square";

/**
 * Centers `count` components in a single column inside the safe zone (all % of canvas, `Place`'s
 * center-origin convention), evenly spaced, tighter in portrait. `safe` is already in % (the caller
 * converts `useViewport().safe`'s px values before calling this, keeping the function itself pure).
 */
export function stackLayout(
  count: number,
  orientation: Orientation,
  safe: { x: number; top: number; bottom: number },
): Place[] {
  if (count <= 0) return [];
  const usableTop = safe.top;
  const usableHeight = 100 - safe.bottom - safe.top;
  const divisor = orientation === "portrait" ? 2.4 : 1.6;
  const gap = count > 1 ? usableHeight / (count * divisor) : 0;
  const totalSpan = gap * (count - 1);
  const startY = usableTop + (usableHeight - totalSpan) / 2;
  const places: Place[] = [];
  for (let i = 0; i < count; i++) places.push({ x: 50, y: startY + gap * i });
  return places;
}

/** Throws past `max` rects (default 8, matching the reference implementation's own choice) instead of
 * silently leaving a region uncovered. */
export function redactRectBudget(count: number, max = 8): void {
  if (count > max) throw new Error(`redact: ${count} rects exceeds the ${max}-rect budget`);
}

/** How much vertical space a toast still occupies in its stack: fully in and not yet leaving is 1;
 * `enter` and `leave` are the same 0-1 progress values `toast.tsx` already computes for its own slide. */
export function occupancy(enter: number, leave: number): number {
  return enter * (1 - leave);
}

/** The running sum of occupancy-weighted heights above `index` — a slot's y-offset in a closing-up stack,
 * with no measured DOM and no state, just a sum over already-computed per-toast values. */
export function stackOffset(items: { occupancy: number; height: number }[], index: number): number {
  let sum = 0;
  for (let i = 0; i < index; i++) sum += items[i].occupancy * items[i].height;
  return sum;
}

/** Per-item arrival frame, accelerating as the list grows (M2: speed comes from acceleration, ties the
 * pace to "how many tasks are left" as a physical metaphor) — `staggerDelay`'s own `"compress"` shape,
 * whose sub-linear growth is what actually shortens later gaps (`"accelerando"`'s gaps grow, the opposite). */
export function checklistSchedule(items: unknown[], gap = 5): number[] {
  return items.map((_, i) => staggerDelay(i, items.length, { step: gap, shape: "compress" }));
}

/** Content-derived duration when a checklist sets no explicit `at`s: the last item's arrival plus a fixed
 * hold, in frames. */
export function checklistDuration(items: unknown[], fps = 30): number {
  const schedule = checklistSchedule(items);
  const last = schedule.length > 0 ? schedule[schedule.length - 1] : 0;
  return last + Math.round(fps * 1.2);
}

export type Rect = { x: number; y: number; width: number; height: number };
export type NamedLayout = "grid" | "mosaic" | "strip";

function gridDims(count: number, orientation: Orientation): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  const targetRatio = orientation === "portrait" ? 9 / 16 : 16 / 9;
  const cols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * targetRatio))));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

/**
 * Closed-form tile rects for a named layout — never measures the DOM (the FLIP technique this replaces
 * would), so both the "from" and "to" rects for a morph are known before any frame renders. `orientation`
 * changes the arrangement, not just the scale: a `strip` is vertical in portrait, horizontal otherwise.
 */
export function layoutRectsFor(
  layout: NamedLayout,
  count: number,
  orientation: Orientation,
  canvas: { width: number; height: number },
): Rect[] {
  if (count <= 0) return [];
  if (layout === "grid") {
    const { cols, rows } = gridDims(count, orientation);
    const w = canvas.width / cols;
    const h = canvas.height / rows;
    return Array.from({ length: count }, (_, i) => ({
      x: (i % cols) * w,
      y: Math.floor(i / cols) * h,
      width: w,
      height: h,
    }));
  }
  if (layout === "strip") {
    const vertical = orientation === "portrait";
    const size = (vertical ? canvas.height : canvas.width) / count;
    return Array.from({ length: count }, (_, i) =>
      vertical
        ? { x: 0, y: i * size, width: canvas.width, height: size }
        : { x: i * size, y: 0, width: size, height: canvas.height },
    );
  }
  // mosaic: one hero tile (60% of the long axis), the rest sharing the remainder in a row or column.
  if (count === 1) return [{ x: 0, y: 0, width: canvas.width, height: canvas.height }];
  const rects: Rect[] = [];
  const heroFrac = 0.6;
  if (orientation === "portrait") {
    const heroH = canvas.height * heroFrac;
    rects.push({ x: 0, y: 0, width: canvas.width, height: heroH });
    const restW = canvas.width / (count - 1);
    for (let i = 0; i < count - 1; i++)
      rects.push({ x: i * restW, y: heroH, width: restW, height: canvas.height - heroH });
  } else {
    const heroW = canvas.width * heroFrac;
    rects.push({ x: 0, y: 0, width: heroW, height: canvas.height });
    const restH = canvas.height / (count - 1);
    for (let i = 0; i < count - 1; i++)
      rects.push({ x: heroW, y: i * restH, width: canvas.width - heroW, height: restH });
  }
  return rects;
}

/** Linear interpolation of every field between two rects — the "to" side of a FLIP morph. */
export function flipInterpolate(from: Rect, to: Rect, t: number): Rect {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

/** Looks up `id` in `anchors`, throwing a named error instead of returning `undefined` — the one
 * consistent contract all four `target` consumers use (ponytail-review should-fix 4). */
export function requireAnchor(anchors: Record<string, AnchorRect>, id: string, itemName: string): AnchorRect {
  const rect = anchors[id];
  if (!rect) throw new Error(`${itemName}: anchor id "${id}" not found`);
  return rect;
}

/** Converts a canvas-relative `%` rect into a rect relative to `contentBox` (also canvas-relative `%`) —
 * `AnchorRect`s are always canvas-% (Task 1), but `ScreenZoomFocus`'s existing `x/y/width/height` is
 * content-relative-% (ponytail-review blocker 1: the two conventions were being mixed with no conversion).
 * The identity `contentBox` (`{x:0,y:0,width:100,height:100}`) is the common case: a `ScreenZoom` that
 * fills the whole canvas, where canvas-% and content-% are the same number. */
export function anchorToContentPercent(rect: AnchorRect, contentBox: AnchorRect): AnchorRect {
  return {
    x: ((rect.x - contentBox.x) / contentBox.width) * 100,
    y: ((rect.y - contentBox.y) / contentBox.height) * 100,
    width: (rect.width / contentBox.width) * 100,
    height: (rect.height / contentBox.height) * 100,
  };
}

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
  const diff = vsub(eye, target);
  // eye === target has no look direction; vnormalize would silently divide a zero vector by 1 and
  // collapse every axis to zero instead of a real matrix. An identity view (no rotation, no translation)
  // is the only sane transform for a camera that hasn't decided where to look yet.
  if (diff.x === 0 && diff.y === 0 && diff.z === 0) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  const zAxis = vnormalize(diff);
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

/**
 * The translate needed to put `target` (normalized 0-1 of the content) at frame center after scaling by
 * `zoom`, computed from the actual measured canvas size instead of a hardcoded stage size — the
 * `terminal-cursor-zoom`/`stage` bug this row exists to fix. Pair with `transformOrigin: "0 0"` and
 * `transform: translate(offset.x, offset.y) scale(zoom)`.
 */
export function lookAtOffset(
  target: { x: number; y: number },
  zoom: number,
  canvasSize: { width: number; height: number },
): { x: number; y: number } {
  const targetPx = { x: target.x * canvasSize.width, y: target.y * canvasSize.height };
  const center = { x: canvasSize.width / 2, y: canvasSize.height / 2 };
  return { x: center.x - zoom * targetPx.x, y: center.y - zoom * targetPx.y };
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

/**
 * Reserves each `to` grapheme against the nearest (by index — a left-to-right text's index already
 * approximates horizontal position before measurement) unclaimed identical `from` grapheme, so a letter
 * shared between two phrases keeps its identity and just translates instead of fading out and back in.
 * Leftover `to` entries get `fromIndex: -1` (a fresh grapheme, fades in); leftover `from` entries get
 * `toIndex: -1` (fades out).
 */
export function matchGraphemes(from: string[], to: string[]): { fromIndex: number; toIndex: number }[] {
  const usedFrom: boolean[] = [];
  const usedTo: boolean[] = [];
  for (let i = 0; i < from.length; i++) usedFrom.push(false);
  for (let i = 0; i < to.length; i++) usedTo.push(false);

  const pairs: { fromIndex: number; toIndex: number }[] = [];
  for (let toIndex = 0; toIndex < to.length; toIndex++) {
    let best = -1;
    let bestDistance = Infinity;
    for (let fromIndex = 0; fromIndex < from.length; fromIndex++) {
      if (usedFrom[fromIndex] || from[fromIndex] !== to[toIndex]) continue;
      const distance = Math.abs(fromIndex - toIndex);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = fromIndex;
      }
    }
    if (best >= 0) {
      usedFrom[best] = true;
      usedTo[toIndex] = true;
      pairs.push({ fromIndex: best, toIndex });
    }
  }
  for (let toIndex = 0; toIndex < to.length; toIndex++) {
    if (!usedTo[toIndex]) pairs.push({ fromIndex: -1, toIndex });
  }
  for (let fromIndex = 0; fromIndex < from.length; fromIndex++) {
    if (!usedFrom[fromIndex]) pairs.push({ fromIndex, toIndex: -1 });
  }
  return pairs;
}
