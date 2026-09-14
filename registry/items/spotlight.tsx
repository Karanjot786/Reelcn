/**
 * @title Spotlight
 * @category backgrounds
 * @description Soft pool of accent light that drifts slowly or holds a position, with a vignette that darkens the edges.
 * @duration sustained
 * @use Product hero shots, single-idea statements and dramatic reveals
 * @use Drawing the eye to one area of the frame without a hard shape
 * @avoid Several directional light shafts — use `beams`
 * @tags spotlight, light, vignette, stage, focus
 * @example
 * <AbsoluteFill>
 *   <Spotlight />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";
import { FlatAccentLook, FlatBlocksLook, GrainFieldLook, GridSweepLook } from "./core-physical-light";

export type SpotlightProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Light color. Defaults to the theme accent. */
  color?: string;
  /** Opacity at the center of the light, 0–1. */
  intensity?: number;
  /** Pin the light at fractions of the canvas (0–1). Omit to let it drift on a slow figure-eight. */
  position?: { x: number; y: number };
  /** Light radius in design units. */
  size?: number;
  /** How dark the corners get, 0–1. */
  vignette?: number;
  /** Drift speed multiplier. 0 holds the light still. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

type SpotlightLook = "pool" | "grid-sweep" | "grain-field" | "flat-blocks" | "flat-accent";

const LOOK_BY_THEME: Record<string, SpotlightLook> = {
  daylight: "pool",
  sunset: "pool",
  midnight: "grid-sweep",
  paper: "grain-field",
  neon: "flat-blocks",
  mono: "flat-accent",
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Spotlight({
  background,
  color,
  intensity = 0.35,
  position,
  size = 820,
  vignette = 0.4,
  speed = 1,
  style,
  className,
  ...motion
}: SpotlightProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const light = color ?? (theme.name === "daylight" ? theme.colors.foreground : theme.colors.accent);
  const seconds = (m.frame / m.fps) * speed;
  // A 1:2 Lissajous curve: a lazy figure-eight around the upper middle of the frame.
  const x = position ? position.x : 0.5 + 0.2 * Math.sin(seconds * 0.5);
  const y = position ? position.y : 0.42 + 0.09 * Math.sin(seconds + 0.6);
  const radius = u(size) * (1 + 0.04 * Math.sin((m.frame / m.fps) * 0.9));
  const strength = intensity * m.presence;

  const look = LOOK_BY_THEME[theme.name] ?? "pool";

  if (look === "grid-sweep")
    return (
      <GridSweepLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "grain-field")
    return (
      <GrainFieldLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        palette={[light]}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "flat-blocks")
    return (
      <FlatBlocksLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        palette={[light, theme.colors.highlight]}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "flat-accent")
    return (
      <FlatAccentLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        background={background}
        className={className}
        style={style}
      />
    );

  const stop = (share: number) => alpha(light, clamp01(strength * share));
  const pool = `radial-gradient(circle ${radius}px at ${x * width}px ${y * height}px, ${stop(1)} 0%, ${stop(0.62)} 22%, ${stop(0.28)} 48%, ${stop(0.08)} 75%, ${stop(0)} 100%)`;
  const edges = `radial-gradient(ellipse farthest-corner at 50% 50%, ${alpha("#000000", 0)} 45%, ${alpha("#000000", clamp01(vignette))} 100%)`;

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor: background ?? theme.colors.background,
        backgroundImage: `${edges}, ${pool}`,
        ...style,
      }}
    />
  );
}
