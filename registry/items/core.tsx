/**
 * @title Core
 * @category lib
 * @description Theme tokens, responsive design units, platform safe zones and motion presets. Every reelcn component builds on this file.
 * @example
 * <ThemeProvider theme="midnight">
 *   <Stage>
 *     <Center><TextReveal text="Hello" /></Center>
 *   </Stage>
 * </ThemeProvider>
 */
/// <reference lib="es2022.intl" />
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "./fonts";

/* ────────────────────────────── Theme ────────────────────────────── */

export type MotionPreset = "smooth" | "snappy" | "bouncy" | "gentle" | "linear" | "settle";

export type Theme = {
  name: string;
  colors: {
    /** Canvas color. */
    background: string;
    /** Cards, windows, bubbles. */
    surface: string;
    foreground: string;
    /** Secondary text. */
    muted: string;
    border: string;
    accent: string;
    /** Text drawn on top of `accent`. */
    accentForeground: string;
    /** Emphasis: marker strokes, active caption word. */
    highlight: string;
  };
  fonts: { heading: string; body: string; mono: string };
  /** Weight for headings. Serif display faces look best at 400. */
  headingWeight: number;
  /** Corner radius in design units (see `useViewport().u`). */
  radius: number;
  /** Default motion personality for every component. */
  motion: MotionPreset;
};

const sans = (family: string) => `${family}, ui-sans-serif, system-ui, sans-serif`;
const serif = (family: string) => `${family}, ui-serif, Georgia, serif`;
const mono = `${fonts.jetbrainsMono}, ui-monospace, SFMono-Regular, monospace`;

export const themes = {
  midnight: {
    name: "midnight",
    colors: {
      background: "#0b0d12",
      surface: "#151922",
      foreground: "#f5f7fb",
      muted: "#8b93a7",
      border: "#262c3a",
      accent: "#6d7cff",
      accentForeground: "#ffffff",
      highlight: "#ffd84d",
    },
    fonts: { heading: sans(fonts.inter), body: sans(fonts.inter), mono },
    headingWeight: 700,
    radius: 20,
    motion: "smooth",
  },
  daylight: {
    name: "daylight",
    colors: {
      background: "#fafafa",
      surface: "#ffffff",
      foreground: "#0a0a0a",
      muted: "#6b7280",
      border: "#e5e7eb",
      accent: "#2563eb",
      accentForeground: "#ffffff",
      highlight: "#fde047",
    },
    fonts: { heading: sans(fonts.inter), body: sans(fonts.inter), mono },
    headingWeight: 700,
    radius: 20,
    motion: "smooth",
  },
  paper: {
    name: "paper",
    colors: {
      background: "#f4efe6",
      surface: "#fffaf1",
      foreground: "#1f1b16",
      muted: "#7a6f60",
      border: "#e3d9c8",
      accent: "#d9480f",
      accentForeground: "#ffffff",
      highlight: "#ffd166",
    },
    // paper — Instrument Serif has a single 400 weight; faux-bolding it looks broken
    fonts: { heading: serif(fonts.instrumentSerif), body: sans(fonts.inter), mono },
    headingWeight: 400,
    radius: 8,
    motion: "gentle",
  },
  neon: {
    name: "neon",
    colors: {
      background: "#07060d",
      surface: "#12101f",
      foreground: "#f2f0ff",
      muted: "#8e88b3",
      border: "#2a2545",
      accent: "#b4ff39",
      accentForeground: "#07060d",
      highlight: "#ff2fb9",
    },
    fonts: { heading: sans(fonts.spaceGrotesk), body: sans(fonts.spaceGrotesk), mono },
    headingWeight: 700,
    radius: 14,
    motion: "snappy",
  },
  mono: {
    name: "mono",
    colors: {
      background: "#000000",
      surface: "#111111",
      foreground: "#ffffff",
      muted: "#8a8a8a",
      border: "#2a2a2a",
      accent: "#ffffff",
      accentForeground: "#000000",
      highlight: "#ffffff",
    },
    fonts: { heading: sans(fonts.inter), body: sans(fonts.inter), mono },
    headingWeight: 700,
    radius: 6,
    motion: "snappy",
  },
  sunset: {
    name: "sunset",
    colors: {
      background: "#1a0f1f",
      surface: "#2a1830",
      foreground: "#fff4ec",
      muted: "#c9a7b5",
      border: "#43293f",
      accent: "#ff7a45",
      accentForeground: "#1a0f1f",
      highlight: "#ffc857",
    },
    fonts: { heading: sans(fonts.bricolage), body: sans(fonts.inter), mono },
    headingWeight: 800,
    radius: 28,
    motion: "bouncy",
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export type ThemeOverrides = Partial<Omit<Theme, "colors" | "fonts">> & {
  colors?: Partial<Theme["colors"]>;
  fonts?: Partial<Theme["fonts"]>;
};

/** Build a brand kit on top of a preset: `createTheme("midnight", { colors: { accent: "#ff5a1f" } })`. */
export function createTheme(base: ThemeName | Theme, overrides: ThemeOverrides = {}): Theme {
  const b: Theme = typeof base === "string" ? themes[base] : base;
  return {
    ...b,
    ...overrides,
    colors: { ...b.colors, ...overrides.colors },
    fonts: { ...b.fonts, ...overrides.fonts },
  };
}

const ThemeContext = createContext<Theme>(themes.midnight);

export function ThemeProvider({
  theme = "midnight",
  children,
}: {
  theme?: ThemeName | Theme;
  children: React.ReactNode;
}) {
  const value = typeof theme === "string" ? themes[theme] : theme;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Any CSS color at a given opacity (0–1). */
export const alpha = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${Math.round(amount * 100)}%, transparent)`;

/* ───────────────────────────── Viewport ───────────────────────────── */

export type Orientation = "landscape" | "portrait" | "square";

const ViewportContext = createContext<{ width: number; height: number } | null>(null);

/** Make children lay out as if the canvas were this size (picture-in-picture, split screens, contact sheets). */
export function Viewport({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  return <ViewportContext.Provider value={{ width, height }}>{children}</ViewportContext.Provider>;
}

export type SafeZonePlatform = "generic" | "tiktok" | "reels" | "shorts";

/** Extra right-edge inset in portrait, as a fraction of width, matching `safe-zone-guide`'s own numbers. */
const PORTRAIT_RIGHT_INSET: Record<SafeZonePlatform, number> = {
  generic: 0.07,
  tiktok: 0.16,
  reels: 0.15,
  shorts: 0.14,
};

/**
 * Canvas size, orientation and design units.
 * `u(n)` = n px on a canvas whose short side is 1080px, so one component looks right at 1920×1080, 1080×1920, 1080×1080 and 1280×720.
 * `safe` = insets that keep content clear of TikTok / Reels / Shorts UI in portrait, and title-safe margins elsewhere.
 * `platform` (default `"generic"`) widens the portrait right inset to match that platform's own action rail; every other value is unchanged.
 */
export function useViewport(platform: SafeZonePlatform = "generic") {
  const config = useVideoConfig();
  const override = useContext(ViewportContext);
  const { width, height } = override ?? config;
  const scale = Math.min(width, height) / 1080;
  const aspect = width / height;
  const orientation: Orientation = aspect > 1.15 ? "landscape" : aspect < 0.87 ? "portrait" : "square";
  const safe =
    orientation === "portrait"
      ? { top: height * 0.12, bottom: height * 0.2, x: width * 0.07, right: width * PORTRAIT_RIGHT_INSET[platform] }
      : { top: height * 0.08, bottom: height * 0.08, x: width * 0.06, right: width * 0.06 };
  return {
    width,
    height,
    scale,
    aspect,
    orientation,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape",
    u: (n: number) => n * scale,
    safe,
  };
}

/* ────────────────────────────── Motion ────────────────────────────── */

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easings: Record<Exclude<MotionPreset, "bouncy" | "settle">, (t: number) => number> = {
  smooth: Easing.bezier(0.16, 1, 0.3, 1),
  snappy: Easing.bezier(0.2, 0.9, 0.1, 1),
  gentle: Easing.bezier(0.45, 0, 0.55, 1),
  linear: Easing.linear,
};

/** Accelerating curve used for exits. */
export const exitEasing = Easing.bezier(0.55, 0, 1, 0.45);

/** 0 → 1 over `duration` frames starting at `from`, shaped by a motion preset. `bouncy` overshoots past 1. */
export function tween(
  frame: number,
  fps: number,
  { from = 0, duration, motion = "smooth" }: { from?: number; duration: number; motion?: MotionPreset },
): number {
  if (duration <= 0) return frame >= from ? 1 : 0;
  if (motion === "bouncy") {
    return spring({
      frame: frame - from,
      fps,
      durationInFrames: duration,
      config: { damping: 12, stiffness: 170, mass: 0.9 },
    });
  }
  if (motion === "settle") {
    const t = Math.min(Math.max((frame - from) / duration, 0), 1);
    if (t <= 0) return 0;
    if (t < 0.4) return interpolate(t, [0, 0.4], [0, 1.06], { ...CLAMP, easing: easings.smooth });
    return 1 + 0.06 * Math.exp(-4.6 * ((t - 0.4) / 0.6));
  }
  return interpolate(frame, [from, from + duration], [0, 1], { ...CLAMP, easing: easings[motion] });
}

export type MotionProps = {
  /** Frames to wait before entering. */
  delay?: number;
  /** Enter duration in frames. Defaults to 0.6s. Some items reuse `duration` for an unrelated local timing — see that item's own prop docs. */
  duration?: number;
  /** Exit at the end of the parent `<Sequence>`. `false` keeps it on screen, a number sets the exit length in frames. */
  exit?: boolean | number;
  /** Override the theme's motion personality. */
  motion?: MotionPreset;
  /** Renders fully entered, with no exit — for a still frame or thumbnail. Defaults to `false`. */
  poster?: boolean;
  /** Delays the start of the exit window by this many frames, for a minimum on-screen hold. Defaults to `0`. */
  holdFrames?: number;
};

/**
 * Shared enter/exit clock. `enter` goes 0 → 1 (may overshoot with `bouncy`), `exit` goes 0 → 1 during the last frames of the
 * parent Sequence, `presence` = clamped enter × (1 − exit).
 */
export function useMotion({
  delay = 0,
  duration,
  exit = true,
  motion,
  poster = false,
  holdFrames = 0,
}: MotionProps = {}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = useTheme();
  const preset = motion ?? theme.motion;
  const enterFrames = duration ?? Math.round(fps * 0.6);
  if (poster) {
    return { frame, fps, durationInFrames, preset, delay, enterFrames, enter: 1, exit: 0, presence: 1 };
  }
  const exitFrames = typeof exit === "number" ? exit : Math.round(fps * 0.35);
  const enter = tween(frame, fps, { from: delay, duration: enterFrames, motion: preset });
  // The last rendered frame is durationInFrames - 1, so the exit has to finish there.
  // A single-frame sequence (a Still, a contact-sheet cell) or a zero-length exit has no room to leave,
  // and would otherwise ask interpolate for a degenerate range.
  const lastFrame = durationInFrames - 1;
  const exitEnd = lastFrame - holdFrames;
  const out =
    exit === false || exitFrames <= 0 || exitEnd <= 0
      ? 0
      : interpolate(frame, [exitEnd - exitFrames, exitEnd], [0, 1], {
          ...CLAMP,
          easing: exitEasing,
        });
  return {
    frame,
    fps,
    durationInFrames,
    preset,
    delay,
    enterFrames,
    enter,
    exit: out,
    presence: Math.min(enter, 1) * (1 - out),
  };
}

/** A locally looped frame number: counts up to `durationInFrames - 1`, holds there for `holdFrames`, then wraps to 0 — seamless for a `<Loop>`-wrapped composition. */
export function useLoop({
  durationInFrames,
  holdFrames = 0,
}: {
  durationInFrames: number;
  holdFrames?: number;
}): number {
  const frame = useCurrentFrame();
  const cycle = Math.max(1, durationInFrames + holdFrames);
  return Math.min(frame % cycle, durationInFrames - 1);
}

/* ─────────────────────────── Per-role motion ─────────────────────────── */

export type RoleShape = { travel: number; opacityLeadFrames: number };

/** Exit travels 60% as far as enter and finishes its opacity 3 frames ahead of its geometry, so it reads as one quick, clean exit rather than a mirrored entrance. */
export const roleDefaults: { enter: RoleShape; exit: RoleShape } = {
  enter: { travel: 1, opacityLeadFrames: 0 },
  exit: { travel: 0.6, opacityLeadFrames: 3 },
};

/**
 * Splits `useMotion`'s single enter/exit clock into per-role shapes: `opacity` and `geometry` (translate/scale
 * progress) can now finish at different times, and `travel(px)` scales a base distance separately for enter and exit.
 */
export function useRoleMotion(
  m: ReturnType<typeof useMotion>,
  overrides?: { enter?: Partial<RoleShape>; exit?: Partial<RoleShape> },
): { opacity: number; geometry: number; travel: (px: number) => { enterPx: number; exitPx: number } } {
  const enterShape = { ...roleDefaults.enter, ...overrides?.enter };
  const exitShape = { ...roleDefaults.exit, ...overrides?.exit };
  const enter = Math.min(m.enter, 1);
  // opacityLeadFrames converted to a share of the exit window, so it stays a frame count regardless of exit length.
  const exitOpacityLead =
    m.exit > 0 && m.exit < 1 ? Math.min(1, m.exit + exitShape.opacityLeadFrames / Math.max(m.fps * 0.35, 1)) : m.exit;
  return {
    opacity: enter * (1 - Math.min(exitOpacityLead, 1)),
    geometry: enter * (1 - m.exit),
    travel: (px: number) => ({ enterPx: px * enterShape.travel, exitPx: px * exitShape.travel }),
  };
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

type SceneClockValue = { delayFor: (index: number, count: number) => number } | null;

const SceneClockContext = createContext<SceneClockValue>(null);

/** Shares one `staggerDelay` timeline with every child that reads it via `useSceneClock`. */
export function SceneClock({
  step,
  order,
  shape,
  seed,
  jitter,
  children,
}: {
  step: number;
  order?: StaggerOrder;
  shape?: StaggerShape;
  seed?: string;
  jitter?: number;
  children: (delayFor: (index: number, count: number) => number) => React.ReactNode;
}) {
  const delayFor = (index: number, count: number) => staggerDelay(index, count, { step, order, shape, seed, jitter });
  return <SceneClockContext.Provider value={{ delayFor }}>{children(delayFor)}</SceneClockContext.Provider>;
}

/** `null` outside a `SceneClock`, so an item can fall back to its own standalone `step` prop. */
export const useSceneClock = () => useContext(SceneClockContext);

/* ────────────────────────────── Layout ────────────────────────────── */

/** Full-bleed canvas painted with the theme background, text color and body font. */
export function Stage({
  children,
  background,
  style,
  className,
}: {
  children?: React.ReactNode;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const t = useTheme();
  return (
    <AbsoluteFill
      className={className}
      style={{
        background: background ?? t.colors.background,
        color: t.colors.foreground,
        fontFamily: t.fonts.body,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** Centers children inside the safe zone. */
export function Center({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { safe } = useViewport();
  return (
    <AbsoluteFill
      className={className}
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/* ────────────────────────────── Text ────────────────────────────── */

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en-US", { granularity: "grapheme" }) : null;

/** Split into user-perceived characters, so emoji and accents never break apart. */
export const graphemes = (text: string) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);

/* ────────────────────────────── Text metrics ────────────────────────────── */

let measureContext: CanvasRenderingContext2D | null = null;

function measurePx(text: string, font: string): number {
  if (typeof document === "undefined") return 0;
  if (!measureContext) measureContext = document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

/** True once `document.fonts` has a face covering this weight for the stack's first family. */
function fontFaceReady(stack: string, weight: number): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;
  const family = stack.split(",")[0].trim().replace(/["']/g, "");
  let found = false;
  document.fonts.forEach((face) => {
    const range = face.weight.split(" ");
    const covers = Number(range[0]) <= weight && weight <= Number(range[range.length - 1]);
    if (covers && face.family.replace(/["']/g, "") === family) found = true;
  });
  return found;
}

/**
 * Real width of `text` set in `style`, measured against the loaded font — gated on the browser's own font-ready
 * signal (`document.fonts.ready` plus a face check, since a font can resolve `ready` before its face is queryable)
 * through `delayRender`/`continueRender`, not a fixed-attempt timer.
 */
export function useTextMetrics(
  text: string,
  style: { fontFamily: string; fontSize: number; fontWeight?: number; letterSpacing?: number },
): { width: number; ready: boolean } {
  const { fontFamily, fontSize, fontWeight = 400, letterSpacing = 0 } = style;
  const [handle] = useState(() => delayRender("useTextMetrics font"));
  const [ready, setReady] = useState(() => fontFaceReady(fontFamily, fontWeight));

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled && fontFaceReady(fontFamily, fontWeight)) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, fontFamily, fontWeight]);

  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  const width = ready
    ? measurePx(text, `${fontWeight} ${fontSize}px ${fontFamily}`) + Math.max(text.length - 1, 0) * letterSpacing
    : 0;
  return { width, ready };
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
    const charFrames = Math.max(1, fps / (cps * jitter));
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

/* ───────────────────────────────── Paths ───────────────────────────────── */

export type PoseKey = { frame: number; x: number; y: number; scale?: number; rotate?: number; width?: number; height?: number };

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** The pose at `frame`, interpolated through every key with one global Catmull-Rom curve instead of per-segment lines. */
export function useKeyframePath(keys: PoseKey[], opts?: { motion?: MotionPreset }): PoseKey {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const sorted = keys.slice().sort((a, b) => a.frame - b.frame);
  if (sorted.length === 0) return { frame, x: 0, y: 0, scale: 1, rotate: 0 };
  if (sorted.length === 1) return sorted[0];

  const clamped = Math.min(Math.max(frame, sorted[0].frame), sorted[sorted.length - 1].frame);
  let segment = 0;
  while (segment < sorted.length - 2 && clamped >= sorted[segment + 1].frame) segment++;

  const at = (i: number) => sorted[Math.min(Math.max(i, 0), sorted.length - 1)];
  const p0 = at(segment - 1);
  const p1 = at(segment);
  const p2 = at(segment + 1);
  const p3 = at(segment + 2);
  const span = Math.max(p2.frame - p1.frame, 1);
  const localT = tween(clamped, fps, { from: p1.frame, duration: span, motion: opts?.motion ?? "linear" });

  type Field = "x" | "y" | "scale" | "rotate" | "width" | "height";
  const field = (key: PoseKey, name: Field, fallback: number) => key[name] ?? fallback;
  const at4 = (name: Field, fallback: number) =>
    catmullRom(field(p0, name, fallback), field(p1, name, fallback), field(p2, name, fallback), field(p3, name, fallback), localT);

  return {
    frame: clamped,
    x: at4("x", 0),
    y: at4("y", 0),
    scale: at4("scale", 1),
    rotate: at4("rotate", 0),
    width: at4("width", 100),
    height: at4("height", 100),
  };
}
