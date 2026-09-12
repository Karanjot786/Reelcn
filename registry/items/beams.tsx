/**
 * @title Beams
 * @category backgrounds
 * @description Soft shafts of accent light fanning out from a corner and sweeping slowly, like stage lights through haze.
 * @duration sustained
 * @use Launch reveals, award-style titles and event promos
 * @use Adding energy behind a logo or headline without busy shapes
 * @avoid A single soft pool of light — use `spotlight`
 * @tags beams, light rays, stage, sweep, god rays
 * @example
 * <AbsoluteFill>
 *   <Beams origin="top-left" />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type BeamsProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Light color. Defaults to the theme accent. */
  color?: string;
  /** Number of beams; 3–6 look best. */
  count?: number;
  /** Where the light comes from. */
  origin?: "top-left" | "top" | "top-right";
  /** Brightest beam opacity near the source, 0–1. */
  intensity?: number;
  /** Beam width in degrees. */
  beamWidth?: number;
  /** Sweep speed multiplier. 0 freezes the beams. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

/** Per-beam width and brightness multipliers, so the fan never looks mechanical. */
const widths = [1, 0.6, 1.3, 0.8, 1.1, 0.7];
const weights = [1, 0.7, 0.9, 0.6, 0.85, 0.75];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Beams({
  background,
  color,
  count = 5,
  origin = "top-left",
  intensity = 0.28,
  beamWidth = 7,
  speed = 1,
  style,
  className,
  ...motion
}: BeamsProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const light = color ?? theme.colors.accent;
  const seconds = (m.frame / m.fps) * speed;
  const ox = origin === "top-left" ? -u(60) : origin === "top-right" ? width + u(60) : width / 2;
  const oy = origin === "top" ? -u(80) : -u(60);
  // conic-gradient angles start at 12 o'clock and run clockwise; aim the fan at a point below the middle.
  const aimAngle = (Math.atan2(width / 2 - ox, oy - height * 0.62) * 180) / Math.PI;
  const spread = origin === "top" ? 38 : 26;
  const beams = Math.max(1, Math.round(count));
  const strength = intensity * m.presence;

  const layers: string[] = [];
  for (let index = 0; index < beams; index++) {
    const along = beams === 1 ? 0 : (index / (beams - 1)) * 2 - 1;
    const sway = 4 * Math.sin(seconds * 0.5 * (1 + 0.15 * index) + index * 1.7);
    const center = aimAngle + spread * along + sway;
    const w = beamWidth * widths[index % widths.length];
    const k = strength * weights[index % weights.length] * (0.78 + 0.22 * Math.sin(seconds * 0.7 + index * 2.1));
    const stop = (share: number) => alpha(light, clamp01(k * share));
    layers.push(
      `conic-gradient(from ${center - w}deg at ${ox}px ${oy}px, ${stop(0)} 0deg, ${stop(0.5)} ${w * 0.5}deg, ${stop(1)} ${w}deg, ${stop(0.5)} ${w * 1.5}deg, ${stop(0)} ${w * 2}deg, ${stop(0)} 360deg)`,
    );
  }
  // Beams lose strength with distance from the source instead of ending in a hard edge.
  const falloff = `radial-gradient(circle farthest-corner at ${ox}px ${oy}px, black 0%, rgba(0,0,0,0.55) 45%, transparent 95%)`;
  const glow = `radial-gradient(circle ${u(560)}px at ${ox}px ${oy}px, ${alpha(light, clamp01(strength * 1.6))} 0%, ${alpha(light, clamp01(strength * 0.45))} 40%, ${alpha(light, 0)} 100%)`;

  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      <AbsoluteFill style={{ backgroundImage: layers.join(", "), WebkitMaskImage: falloff, maskImage: falloff }} />
      <AbsoluteFill style={{ backgroundImage: glow }} />
    </AbsoluteFill>
  );
}
