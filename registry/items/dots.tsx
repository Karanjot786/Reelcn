/**
 * @title Dots
 * @category backgrounds
 * @description Dot matrix with a soft wave of brighter, larger dots sweeping or rippling across it.
 * @duration sustained
 * @use Clean tech, SaaS and data scenes that want texture without lines
 * @use Behind charts, code blocks and UI mockups
 * @avoid A structured line pattern or a perspective floor — use `grid`
 * @tags dots, dot matrix, halftone, pattern, wave
 * @example
 * <AbsoluteFill>
 *   <Dots wave="ripple" />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type DotsProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Resting dot color. Defaults to the theme foreground at low opacity. */
  color?: string;
  /** Dot color at the crest of the wave. Defaults to the theme accent. */
  waveColor?: string;
  /** Distance between dots in design units. */
  spacing?: number;
  /** Resting dot radius in design units; crest dots are about twice as large. */
  size?: number;
  /** `sweep` sends diagonal bands across the frame, `ripple` sends rings out from the center. */
  wave?: "sweep" | "ripple" | "none";
  /** Dot opacity multiplier, 0–1. */
  intensity?: number;
  /** How strongly dots fade toward the edges, 0–1. */
  fade?: number;
  /** Wave speed multiplier. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Dots({
  background,
  color,
  waveColor,
  spacing = 40,
  size = 2.5,
  wave = "sweep",
  intensity = 1,
  fade = 0.6,
  speed = 1,
  style,
  className,
  ...motion
}: DotsProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const base = background ?? theme.colors.background;
  // Whole-pixel tiles: fractional background sizes drift against the device grid and show seams.
  const tile = Math.max(Math.round(u(spacing)), 4);
  const radius = Math.max(u(size), 0.75);
  const soft = Math.max(u(1), 0.75);
  const strength = clamp01(intensity) * m.presence;
  // Put one dot exactly on the canvas center; the pattern repeats outward from there.
  const offset = `${width / 2 - tile / 2}px ${height / 2 - tile / 2}px`;
  const dotLayer = (fill: string, r: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(circle, ${fill} 0px, ${fill} ${r}px, ${alpha(fill, 0)} ${r + soft}px)`,
    backgroundSize: `${tile}px ${tile}px`,
    backgroundPosition: offset,
  });

  // The crest is a second, brighter dot layer revealed through a moving repeating mask.
  const wavelength = u(720);
  const travel = ((m.frame / m.fps) * speed * (wavelength / 3.2)) % wavelength;
  const stops = [
    `transparent ${travel}px`,
    `transparent ${travel + wavelength * 0.3}px`,
    `rgba(0,0,0,0.35) ${travel + wavelength * 0.4}px`,
    `black ${travel + wavelength * 0.5}px`,
    `rgba(0,0,0,0.35) ${travel + wavelength * 0.6}px`,
    `transparent ${travel + wavelength * 0.7}px`,
    `transparent ${travel + wavelength}px`,
  ].join(", ");
  const crestMask =
    wave === "ripple"
      ? `repeating-radial-gradient(circle at 50% 50%, ${stops})`
      : `repeating-linear-gradient(115deg, ${stops})`;
  const inner = (1 - clamp01(fade)) * 90;

  return (
    <AbsoluteFill className={className} style={{ background: base, ...style }}>
      <div style={{ ...dotLayer(color ?? alpha(theme.colors.foreground, 0.16), radius), opacity: strength }} />
      {wave !== "none" && (
        <div
          style={{
            ...dotLayer(waveColor ?? alpha(theme.colors.accent, 0.85), radius * 1.9),
            opacity: strength,
            WebkitMaskImage: crestMask,
            maskImage: crestMask,
          }}
        />
      )}
      {fade > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse farthest-corner at 50% 50%, ${alpha(base, 0)} ${inner}%, ${base} 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
}
