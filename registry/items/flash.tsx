/**
 * @title Flash
 * @category overlays
 * @description Full-frame flash with a near-instant attack and an exponential decay, fired at `delay`.
 * @duration 20
 * @use Hitting a beat, a drop or a hard cut
 * @use Camera-flash moments and reveals
 * @avoid A slow, warm glow over footage — use `light-leak`
 * @tags flash, strobe, beat, hit, cut
 * @example
 * <Flash delay={24} strength={0.8} />
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { type MotionProps, useMotion, useTheme } from "./core";

export type FlashProps = MotionProps & {
  /** Flash color. Defaults to the theme foreground. */
  color?: string;
  /** Peak opacity, 0-1. */
  strength?: number;
  /** Frames from `delay` to full strength. */
  attack?: number;
  /** How the flash blends with the frame below, e.g. `screen` to brighten rather than cover. */
  blendMode?: React.CSSProperties["mixBlendMode"];
  style?: React.CSSProperties;
  className?: string;
};

/** `duration` is the decay: frames from the peak until about 1% is left. Defaults to 0.6s. */
export function Flash({
  color,
  strength = 0.9,
  attack = 2,
  blendMode = "normal",
  style,
  className,
  ...motion
}: FlashProps) {
  const theme = useTheme();
  const m = useMotion(motion);
  const attackFrames = Math.max(Math.round(attack), 1);
  const since = m.frame - m.delay;
  const decay = (since - attackFrames) / Math.max(m.enterFrames, 1);
  const level =
    since < 0
      ? 0
      : since < attackFrames
        ? (since + 1) / (attackFrames + 1)
        : // e^-4.6 ≈ 0.01, so the flash has all but gone when `duration` runs out.
          decay >= 1
          ? 0
          : Math.exp(-4.6 * decay);

  return (
    <AbsoluteFill
      className={className}
      style={{
        background: color ?? theme.colors.foreground,
        opacity: strength * level * (1 - m.exit),
        mixBlendMode: blendMode,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
