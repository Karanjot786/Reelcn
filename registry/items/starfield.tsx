/**
 * @title Starfield
 * @category backgrounds
 * @description Seeded field of twinkling stars that drifts sideways with depth parallax or flies slowly toward the viewer.
 * @duration sustained
 * @use Space, AI and "big idea" openers, countdowns and launch intros
 * @use A dark, quiet backdrop with a sense of depth
 * @avoid Large soft out-of-focus discs — use `bokeh`
 * @tags stars, space, night, parallax, particles
 * @example
 * <AbsoluteFill>
 *   <Starfield travel="toward" />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type StarfieldProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Star color. Defaults to the theme foreground. */
  color?: string;
  /** Color for roughly one star in eight. Defaults to the theme accent. */
  accentColor?: string;
  count?: number;
  /** `across` drifts sideways with parallax, `toward` flies slowly into the field. */
  travel?: "across" | "toward";
  /** Largest star radius in design units. */
  size?: number;
  /** Star opacity multiplier, 0–1. */
  intensity?: number;
  /** Twinkle depth, 0–1. 0 keeps every star steady. */
  twinkle?: number;
  /** Same seed, same sky. */
  seed?: number | string;
  /** Travel speed multiplier. Twinkle keeps its own pace, so 0 gives a still, twinkling sky. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

/** Far and near limits of a star's depth cycle in `toward` mode. */
const FAR = 1.15;
const NEAR = 0.15;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Starfield({
  background,
  color,
  accentColor,
  count = 180,
  travel = "across",
  size = 3,
  intensity = 1,
  twinkle = 0.35,
  seed = 1,
  speed = 1,
  style,
  className,
  ...motion
}: StarfieldProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const stars = useMemo(
    () =>
      Array.from({ length: Math.max(0, Math.round(count)) }, (_, i) => ({
        x: random(`${seed}-x-${i}`),
        y: random(`${seed}-y-${i}`),
        depth: random(`${seed}-z-${i}`),
        phase: random(`${seed}-p-${i}`) * Math.PI * 2,
        rate: 0.8 + random(`${seed}-r-${i}`) * 1.6,
        tinted: random(`${seed}-c-${i}`) < 0.12,
      })),
    [count, seed],
  );
  const clock = m.frame / m.fps;
  const seconds = clock * speed;
  const maxRadius = u(size);
  const margin = maxRadius * 4;
  const star = color ?? theme.colors.foreground;
  const tint = accentColor ?? theme.colors.accent;
  const reach = Math.max(width, height) * 0.22;

  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      <svg width={width} height={height} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {stars.map((s, i) => {
          const shimmer = 1 - clamp01(twinkle) * (0.5 + 0.5 * Math.sin(clock * s.rate * 2 + s.phase));
          let cx: number;
          let cy: number;
          let r: number;
          let visible: number;
          if (travel === "toward") {
            // Each star loops from far to near; projection spreads it outward and grows it as it approaches.
            const cycle = (((s.depth - seconds * 0.08) % 1) + 1) % 1;
            const z = NEAR + cycle * (FAR - NEAR);
            const spreadX = (s.x * 2 - 1) * reach;
            const spreadY = (s.y * 2 - 1) * reach;
            cx = width / 2 + spreadX / z;
            cy = height / 2 + spreadY / z;
            r = Math.min(maxRadius * 0.35 * (1 / z), maxRadius * 1.4);
            // Fade in from the far end and out at the near end so wrapping never pops.
            visible = clamp01((FAR - z) / 0.25) * clamp01((z - NEAR) / 0.15);
          } else {
            const near = 0.25 + 0.75 * s.depth;
            const span = width + margin * 2;
            const drift = seconds * u(30) * near;
            cx = ((((s.x * span - drift) % span) + span) % span) - margin;
            cy = s.y * height;
            r = maxRadius * (0.3 + 0.7 * near * near);
            visible = 0.35 + 0.65 * near;
          }
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={Math.max(r, 0.5)}
              fill={s.tinted ? tint : star}
              opacity={clamp01(intensity) * visible * shimmer * m.presence}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
