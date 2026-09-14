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
import type React from "react";
import { createContext, useContext, useEffect, useId, useState } from "react";
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
import {
  catmullRom,
  clamp01,
  coverPhase,
  graphemeInitial,
  graphemes,
  type Mat4,
  type MotionPersonality,
  type MotionPreset,
  mat4LookAt,
  mat4Multiply,
  projectPoint,
  punchCurve,
  type Quat,
  quantizeMotion,
  quatFromLookAt,
  quatSlerp,
  type StaggerOrder,
  type StaggerShape,
  staggerDelay,
  type TypingModel,
  useTypedText,
  useVariableFontAxis,
  type Vec3,
} from "./core-math";
import { strokeWidthProfile } from "./core-stroke";
import { fonts } from "./fonts";

// Pure math (motion quantization, stagger ordering, keyframe interpolation, the typing model, grapheme
// helpers) lives in ./core-math so node --test can import it directly — core.tsx is JSX and can't be
// loaded by node's native TypeScript loader. Re-exported here so no item's import site changes.
export {
  clamp01,
  coverPhase,
  graphemeInitial,
  graphemes,
  type Mat4,
  type MotionPersonality,
  type MotionPreset,
  mat4LookAt,
  mat4Multiply,
  projectPoint,
  punchCurve,
  type Quat,
  quantizeMotion,
  quatFromLookAt,
  quatSlerp,
  type StaggerOrder,
  type StaggerShape,
  staggerDelay,
  type TypingModel,
  useTypedText,
  useVariableFontAxis,
  type Vec3,
};

/* ────────────────────────────── Theme ────────────────────────────── */

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
    /** Positive/confirmed status (toasts, deltas, diffs). */
    success: string;
    /** Caution status. */
    warning: string;
    /** Negative/error status (toasts, deltas, diffs). */
    danger: string;
    /** Neutral informational status. */
    info: string;
    /** Base color for drop shadows, before `alpha()`. */
    shadow: string;
  };
  fonts: { heading: string; body: string; mono: string };
  /** Weight for headings. Serif display faces look best at 400. */
  headingWeight: number;
  /** Corner radius in design units (see `useViewport().u`). */
  radius: number;
  /** Default motion personality for every component. */
  motion: MotionPersonality;
  /** Line quality for arrow/highlight/scribble-circle/svg-draw (Phase 2). */
  stroke: "vector" | "marker" | "brush";
  /** Non-color, non-motion visual traits a theme needs and no other field carries. Optional: undefined is a valid, empty `material` for any theme that doesn't need one. */
  material?: {
    /** 0-1 opacity of the film-grain layer (the `grain` item's default when it gets no explicit `opacity`). */
    grain?: number;
    /** 0-1 bloom around bright edges, film-look themes only. */
    halation?: number;
    /** Contact-shadow falloff under a device frame or stage. */
    floorShadow?: "hard" | "soft";
  };
};

const sans = (family: string) => `${family}, ui-sans-serif, system-ui, sans-serif`;
const mono = `${fonts.jetbrainsMono}, ui-monospace, SFMono-Regular, monospace`;

export const themes = {
  midnight: {
    name: "midnight",
    colors: {
      background: "#0F2B55",
      surface: "#123564",
      foreground: "#EAF2FF",
      muted: "#9FB6D6",
      border: "#6FA8FF",
      accent: "#FFFFFF",
      accentForeground: "#0F2B55",
      highlight: "#FFD60A",
      success: "#4ADE9A",
      warning: "#FFD60A",
      danger: "#FF5C5C",
      info: "#6FA8FF",
      shadow: "#020B1A",
    },
    get fonts() {
      return {
        heading: sans(fonts.ibmPlexSansCondensed),
        body: sans(fonts.ibmPlexSans),
        mono: `${fonts.ibmPlexMono}, ui-monospace, SFMono-Regular, monospace`,
      };
    },
    headingWeight: 600,
    radius: 2,
    motion: "snappy",
    stroke: "vector",
  },
  daylight: {
    name: "daylight",
    colors: {
      background: "#EEF0F2",
      surface: "#FFFFFF",
      foreground: "#121417",
      muted: "#5C636E",
      border: "#e5e7eb",
      accent: "#2F5BFF",
      accentForeground: "#ffffff",
      highlight: "#FFD23F",
      success: "#1E9E5A",
      warning: "#B8860B",
      danger: "#D6403A",
      info: "#2F5BFF",
      shadow: "#121417",
    },
    get fonts() {
      return { heading: sans(fonts.schibstedGrotesk), body: sans(fonts.schibstedGrotesk), mono };
    },
    headingWeight: 700,
    radius: 14,
    motion: "settle",
    stroke: "vector",
    material: { floorShadow: "soft" },
  },
  paper: {
    name: "paper",
    colors: {
      background: "#F1F1EC",
      surface: "#fffaf1",
      foreground: "#26262B",
      muted: "#7a6f60",
      border: "#e3d9c8",
      accent: "#EE4B2B",
      accentForeground: "#ffffff",
      highlight: "#FFC93C",
      success: "#2447D8",
      warning: "#FFC93C",
      danger: "#EE4B2B",
      info: "#26262B",
      shadow: "#26262B",
    },
    get fonts() {
      return { heading: sans(fonts.bricolage), body: sans(fonts.atkinsonHyperlegible), mono };
    },
    headingWeight: 800,
    radius: 6,
    motion: { preset: "gentle", step: 2, jitter: 1 },
    stroke: "brush",
    material: { grain: 0.35 },
  },
  neon: {
    name: "neon",
    colors: {
      background: "#2233FF",
      surface: "#12101f",
      foreground: "#0E0E10",
      muted: "#8e88b3",
      border: "#2a2545",
      accent: "#FF3D8B",
      accentForeground: "#ffffff",
      highlight: "#FFE34D",
      success: "#39FFB4",
      warning: "#FFE34D",
      danger: "#FF3D8B",
      info: "#2233FF",
      shadow: "#0E0E10",
    },
    get fonts() {
      return { heading: sans(fonts.anton), body: sans(fonts.rubik), mono };
    },
    headingWeight: 800,
    radius: 999,
    // bouncy is the primary trait; the spec's second trait for neon ("accelerando stagger") is a
    // StaggerShape, not a Theme field (staggerDelay/SceneClock take shape as a per-call-site option,
    // core-math.ts's StaggerShape type has no per-theme default hook) — see the note after this object
    // for where that half of the direction actually lands.
    motion: "bouncy",
    stroke: "marker",
  },
  mono: {
    name: "mono",
    colors: {
      background: "#F4F4F1",
      surface: "#ffffff",
      foreground: "#141414",
      muted: "#8a8a8a",
      border: "#2a2a2a",
      accent: "#E4002B",
      accentForeground: "#ffffff",
      highlight: "#E4002B",
      success: "#141414",
      warning: "#141414",
      danger: "#E4002B",
      info: "#141414",
      shadow: "#141414",
    },
    get fonts() {
      return { heading: sans(fonts.archivoVariable), body: sans(fonts.archivo), mono };
    },
    headingWeight: 700,
    radius: 0,
    motion: "snappy",
    stroke: "vector",
  },
  sunset: {
    name: "sunset",
    colors: {
      background: "#1B2A2C",
      surface: "#132022",
      foreground: "#F3EDE4",
      muted: "#c9a7b5",
      border: "#43293f",
      accent: "#FF7A2F",
      accentForeground: "#1a0f1f",
      highlight: "#F2C38B",
      success: "#8FBF9A",
      warning: "#F2C38B",
      danger: "#FF7A2F",
      info: "#F3EDE4",
      shadow: "#0C1A1D",
    },
    get fonts() {
      return { heading: `${fonts.cormorantGaramond}, ui-serif, Georgia, serif`, body: sans(fonts.manrope), mono };
    },
    headingWeight: 500,
    radius: 0,
    motion: { preset: "settle", step: 1, jitter: 0 },
    stroke: "vector",
    material: { grain: 0.15, halation: 0.4 },
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

const ThemeContext = createContext<Theme>(themes.daylight);

export function ThemeProvider({
  theme = "daylight",
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
  {
    from = 0,
    duration,
    motion = "smooth",
    step = 1,
    jitter = 0,
    seed = "tween",
  }: { from?: number; duration: number; motion?: MotionPreset; step?: number; jitter?: number; seed?: string },
): number {
  if (duration <= 0) return frame >= from ? 1 : 0;
  const wobble = jitter > 0 ? Math.round((random(`${seed}-${Math.floor(frame / step)}`) - 0.5) * 2 * jitter * step) : 0;
  const f = step > 1 ? Math.floor((frame + wobble) / step) * step : frame;
  if (motion === "bouncy") {
    return spring({
      frame: f - from,
      fps,
      durationInFrames: duration,
      config: { damping: 12, stiffness: 170, mass: 0.9 },
    });
  }
  if (motion === "settle") {
    const t = Math.min(Math.max((f - from) / duration, 0), 1);
    if (t <= 0) return 0;
    if (t < 0.4) return interpolate(t, [0, 0.4], [0, 1.06], { ...CLAMP, easing: easings.smooth });
    return 1 + 0.06 * Math.exp(-4.6 * ((t - 0.4) / 0.6));
  }
  return interpolate(f, [from, from + duration], [0, 1], { ...CLAMP, easing: easings[motion] });
}

export type MotionProps = {
  /** Frames to wait before entering. */
  delay?: number;
  /** Enter duration in frames. Defaults to 0.6s. Some items reuse `duration` for an unrelated local timing — see that item's own prop docs. */
  duration?: number;
  /** Exit at the end of the parent `<Sequence>`. `false` keeps it on screen, a number sets the exit length in frames. */
  exit?: boolean | number;
  /** Override the theme's motion personality. */
  motion?: MotionPersonality;
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
  const personality = quantizeMotion(motion ?? theme.motion);
  const preset = personality.preset;
  const enterFrames = duration ?? Math.round(fps * 0.6);
  if (poster) {
    return { frame, fps, durationInFrames, preset, delay, enterFrames, enter: 1, exit: 0, presence: 1 };
  }
  const exitFrames = typeof exit === "number" ? exit : Math.round(fps * 0.35);
  const enter = tween(frame, fps, {
    from: delay,
    duration: enterFrames,
    motion: preset,
    step: personality.step,
    jitter: personality.jitter,
  });
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

/* ────────────────────────────── Text metrics ────────────────────────────── */

let measureContext: CanvasRenderingContext2D | null = null;

function measurePx(text: string, font: string): number {
  if (typeof document === "undefined") return 0;
  if (!measureContext) measureContext = document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

/** True once `document.fonts` has a face covering this weight for any family in the stack (not just the first). */
function fontFaceReady(stack: string, weight: number): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;
  const families = stack.split(",").map((f) => f.trim().replace(/["']/g, ""));
  let found = false;
  document.fonts.forEach((face) => {
    const range = face.weight.split(" ");
    const covers = Number(range[0]) <= weight && weight <= Number(range[range.length - 1]);
    if (covers && families.indexOf(face.family.replace(/["']/g, "")) !== -1) found = true;
  });
  return found;
}

/** Bounded fallback for `useTextMetrics`, matching the old fit-title cap (`++attempts > 40`, ~2s at one check per frame). */
const FONT_READY_TIMEOUT_MS = 2000;

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
    // Safety net: if the face check never resolves (e.g. document.fonts.ready never settles), proceed
    // with whatever measurement is available instead of hanging the render forever.
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, FONT_READY_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
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

/* ───────────────────────────────── Paths ───────────────────────────────── */

export type PoseKey = {
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  width?: number;
  height?: number;
};

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
    catmullRom(
      field(p0, name, fallback),
      field(p1, name, fallback),
      field(p2, name, fallback),
      field(p3, name, fallback),
      localT,
    );

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

export type StrokeKind = Theme["stroke"];

/**
 * Renders `d` (already in a `pathLength={1}`-normalized coordinate space, the convention every stroke
 * consumer here already uses) as one of the three line qualities: `vector` is a single clean stroke,
 * `marker` adds a wider, blurred, low-opacity duplicate underneath (a feathered double-stroke), `brush`
 * splits the path into segments whose width follows strokeWidthProfile (thick mid, thin ends) plus a
 * seeded grain filter. `drawn` is the existing 0-1 draw-on progress every consumer already computes
 * (`strokeDashoffset={1 - drawn}`); this component owns the visual, not the timing.
 */
export function StrokeOverlay({
  d,
  kind,
  seed,
  color,
  strokeWidth,
  drawn,
  extraProps,
}: {
  d: string;
  kind: StrokeKind;
  seed: string;
  color: string;
  strokeWidth: number;
  drawn: number;
  /** Passed to every underlying `<path>` (e.g. `strokeLinecap`, `fill`). */
  extraProps?: React.SVGProps<SVGPathElement>;
}) {
  const dashProps = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - drawn } as const;
  // Mixed into every filter id below so 2+ StrokeOverlay instances sharing a `seed` (e.g. highlight.tsx's
  // hardcoded seeds, or Arrow/ScribbleCircle defaults) don't collide on the same <filter id> and end up
  // resolving `url(#id)` to each other's filter. `seed` alone still drives noise/random seeding so pixels
  // stay deterministic.
  const instanceId = useId().replace(/:/g, "");
  if (kind === "vector") {
    return <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" {...dashProps} {...extraProps} />;
  }
  if (kind === "marker") {
    const featherId = `stroke-feather-${instanceId}-${seed.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    return (
      <>
        <defs>
          <filter id={featherId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={strokeWidth * 0.35} />
          </filter>
        </defs>
        <path
          d={d}
          stroke={color}
          strokeWidth={strokeWidth * 1.7}
          fill="none"
          opacity={0.3}
          filter={`url(#${featherId})`}
          {...dashProps}
          {...extraProps}
        />
        <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" {...dashProps} {...extraProps} />
      </>
    );
  }
  // brush: N normalized-length segments, each with its own strokeWidthProfile-driven width, plus a
  // shared seeded grain filter so the ribbon reads as textured rather than a flat taper.
  const grainId = `stroke-grain-${instanceId}-${seed.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const segments = 10;
  return (
    <>
      <defs>
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.9}
            numOctaves={2}
            seed={Math.round(random(`${seed}-grain`) * 1000)}
          />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>
      {Array.from({ length: segments }, (_, i) => {
        const segLen = 1 / segments;
        const t = (i + 0.5) * segLen;
        const w = strokeWidth * strokeWidthProfile(t, seed);
        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={w}
            fill="none"
            pathLength={1}
            strokeDasharray={`${segLen} ${1 - segLen}`}
            strokeDashoffset={i * -segLen + (1 - drawn)}
            filter={`url(#${grainId})`}
            {...extraProps}
          />
        );
      })}
    </>
  );
}
