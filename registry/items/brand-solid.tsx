/**
 * @title Brand Solid
 * @category backgrounds
 * @description Theme background with a slow, breathing radial tint of the accent color for clean brand scenes.
 * @duration sustained
 * @use Title cards, logo reveals and end screens that need a calm, on-brand canvas
 * @use Text-heavy scenes where a busier background would compete with the words
 * @avoid Scenes that need visible movement behind them — use `gradient-mesh`
 * @tags solid, brand, tint, minimal, calm
 * @example
 * <AbsoluteFill>
 *   <BrandSolid />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type BrandSolidProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Tint color. Defaults to the theme accent. */
  color?: string;
  /** Peak tint opacity, 0–1. */
  intensity?: number;
  /** Tint center as fractions of the canvas (0–1). */
  position?: { x: number; y: number };
  /** One breath takes 6 seconds at speed 1. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function BrandSolid({
  background,
  color,
  intensity = 0.22,
  position = { x: 0.5, y: 0.6 },
  speed = 1,
  style,
  className,
  ...motion
}: BrandSolidProps) {
  const theme = useTheme();
  const { width, height } = useViewport();
  const m = useMotion(motion);
  const tint = color ?? theme.colors.accent;
  const seconds = (m.frame / m.fps) * speed;
  // Starts at the bottom of a breath so the entrance and the first inhale read as one gesture.
  const breath = 0.5 - 0.5 * Math.cos((seconds / 6) * Math.PI * 2);
  const strength = intensity * m.presence * (0.7 + 0.3 * breath);
  const radius = Math.max(width, height) * (0.55 + 0.06 * breath);
  const at = `${position.x * 100}% ${position.y * 100}%`;
  const stop = (share: number) => alpha(tint, clamp01(strength * share));

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor: background ?? theme.colors.background,
        backgroundImage: `radial-gradient(circle ${radius}px at ${at}, ${stop(1)} 0%, ${stop(0.62)} 30%, ${stop(0.25)} 62%, ${stop(0.06)} 85%, ${stop(0)} 100%)`,
        ...style,
      }}
    />
  );
}
