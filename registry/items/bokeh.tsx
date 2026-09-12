/**
 * @title Bokeh
 * @category backgrounds
 * @description Seeded out-of-focus light discs floating upward, larger and softer ones moving faster for depth.
 * @duration sustained
 * @use Warm, celebratory or lifestyle scenes: holidays, thank-yous, testimonials
 * @use A soft, cinematic backdrop behind quotes and names
 * @avoid Tiny pin-sharp points of light — use `starfield`
 * @tags bokeh, lights, blur, depth, particles
 * @example
 * <AbsoluteFill>
 *   <Bokeh />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type BokehProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Disc colors, picked per disc by seed. Defaults to accent and highlight. */
  colors?: string[];
  count?: number;
  /** Largest disc diameter in design units. */
  size?: number;
  /** Opacity of the nearest, brightest disc, 0–1. */
  intensity?: number;
  /** Same seed, same layout. */
  seed?: number | string;
  /** Float speed multiplier. 0 holds the discs in place. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Bokeh({
  background,
  colors,
  count = 22,
  size = 280,
  intensity = 0.3,
  seed = 1,
  speed = 1,
  style,
  className,
  ...motion
}: BokehProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const palette = colors ?? [theme.colors.accent, theme.colors.highlight];
  const discs = useMemo(
    () =>
      Array.from({ length: Math.max(0, Math.round(count)) }, (_, i) => ({
        depth: random(`${seed}-d-${i}`),
        x: random(`${seed}-x-${i}`),
        y: random(`${seed}-y-${i}`),
        phase: random(`${seed}-p-${i}`) * Math.PI * 2,
        pick: random(`${seed}-c-${i}`),
      })).sort((a, b) => a.depth - b.depth),
    [count, seed],
  );
  const seconds = (m.frame / m.fps) * speed;
  const clock = m.frame / m.fps;
  const largest = u(size);
  const span = height + largest * 2;

  return (
    <AbsoluteFill
      className={className}
      style={{ background: background ?? theme.colors.background, overflow: "hidden", ...style }}
    >
      {discs.map((disc, i) => {
        // Nearer discs are bigger, faster, dimmer and softer, like a real shallow depth of field.
        const diameter = largest * (0.25 + 0.75 * disc.depth);
        const rise = seconds * u(22 + 60 * disc.depth);
        const top = ((((disc.y * span - rise) % span) + span) % span) - largest;
        const left = disc.x * width + Math.sin(clock * (0.3 + 0.2 * disc.depth) + disc.phase) * u(24) - diameter / 2;
        const color = palette[Math.floor(disc.pick * palette.length) % palette.length];
        const k = intensity * m.presence * (1 - 0.45 * disc.depth) * (0.82 + 0.18 * Math.sin(clock * 0.8 + disc.phase));
        const stop = (share: number) => alpha(color, clamp01(k * share));
        const edge = 80 - 25 * disc.depth;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width: diameter,
              height: diameter,
              background: `radial-gradient(circle closest-side, ${stop(0.6)} 0%, ${stop(0.75)} ${edge * 0.75}%, ${stop(0.9)} ${edge}%, ${stop(0)} 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
