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
import { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "./fonts";

/* ────────────────────────────── Theme ────────────────────────────── */

export type MotionPreset = "smooth" | "snappy" | "bouncy" | "gentle" | "linear";

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

/**
 * Canvas size, orientation and design units.
 * `u(n)` = n px on a canvas whose short side is 1080px, so one component looks right at 1920×1080, 1080×1920, 1080×1080 and 1280×720.
 * `safe` = insets that keep content clear of TikTok / Reels / Shorts UI in portrait, and title-safe margins elsewhere.
 */
export function useViewport() {
  const config = useVideoConfig();
  const override = useContext(ViewportContext);
  const { width, height } = override ?? config;
  const scale = Math.min(width, height) / 1080;
  const aspect = width / height;
  const orientation: Orientation = aspect > 1.15 ? "landscape" : aspect < 0.87 ? "portrait" : "square";
  const safe =
    orientation === "portrait"
      ? { top: height * 0.12, bottom: height * 0.2, x: width * 0.07 }
      : { top: height * 0.08, bottom: height * 0.08, x: width * 0.06 };
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

export const easings: Record<Exclude<MotionPreset, "bouncy">, (t: number) => number> = {
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
  return interpolate(frame, [from, from + duration], [0, 1], { ...CLAMP, easing: easings[motion] });
}

export type MotionProps = {
  /** Frames to wait before entering. */
  delay?: number;
  /** Enter duration in frames. Defaults to 0.6s. */
  duration?: number;
  /** Exit at the end of the parent `<Sequence>`. `false` keeps it on screen, a number sets the exit length in frames. */
  exit?: boolean | number;
  /** Override the theme's motion personality. */
  motion?: MotionPreset;
};

/**
 * Shared enter/exit clock. `enter` goes 0 → 1 (may overshoot with `bouncy`), `exit` goes 0 → 1 during the last frames of the
 * parent Sequence, `presence` = clamped enter × (1 − exit).
 */
export function useMotion({ delay = 0, duration, exit = true, motion }: MotionProps = {}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = useTheme();
  const preset = motion ?? theme.motion;
  const enterFrames = duration ?? Math.round(fps * 0.6);
  const exitFrames = typeof exit === "number" ? exit : Math.round(fps * 0.35);
  const enter = tween(frame, fps, { from: delay, duration: enterFrames, motion: preset });
  // The last rendered frame is durationInFrames - 1, so the exit has to finish there.
  // A single-frame sequence (a Still, a contact-sheet cell) or a zero-length exit has no room to leave,
  // and would otherwise ask interpolate for a degenerate range.
  const lastFrame = durationInFrames - 1;
  const out =
    exit === false || exitFrames <= 0 || lastFrame <= 0
      ? 0
      : interpolate(frame, [lastFrame - exitFrames, lastFrame], [0, 1], {
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
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Split into user-perceived characters, so emoji and accents never break apart. */
export const graphemes = (text: string) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
