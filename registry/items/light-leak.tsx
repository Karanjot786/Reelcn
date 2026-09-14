/**
 * @title Light Leak
 * @category overlays
 * @description Warm film light leak: large soft glows sweep across the frame in screen blend, swell to a peak and fade.
 * @duration 63
 * @use Organic warmth between shots, over B-roll, photos or a title card
 * @use Softening a cut with a filmic glow
 * @avoid A hard, fast accent on a beat — use `flash`
 * @tags film, glow, leak, warm, vintage, analog
 * @example
 * <Sequence from={60} durationInFrames={70}>
 *   <LightLeak side="right" strength={0.8} />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill, random } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type LightLeakProps = MotionProps & {
  /** Main glow. Defaults to the theme highlight. */
  color?: string;
  /** Second glow, also blended half-and-half with the first. Defaults to the theme accent. */
  secondaryColor?: string;
  /** Side the glow sweeps in from. */
  side?: "left" | "right";
  /** Peak opacity, 0-1. */
  strength?: number;
  /** Frames held at the peak before the fade. Defaults to 0.3s. */
  hold?: number;
  /** Frames to swell to the peak. Wins over `duration`. Defaults to 0.6s. */
  swellFrames?: number;
  seed?: string | number;
  style?: React.CSSProperties;
  className?: string;
};

const WEIGHTS = [1, 0.75, 0.55];

/** `duration` is the swell to the peak (default 0.6s); the fade after the hold takes twice as long. */
export function LightLeak({
  color,
  secondaryColor,
  side = "left",
  strength = 0.85,
  hold,
  swellFrames,
  seed = "light-leak",
  style,
  className,
  ...motion
}: LightLeakProps) {
  const theme = useTheme();
  const { width, height } = useViewport();
  const m = useMotion(motion);
  const main = color ?? theme.colors.highlight;
  const second = secondaryColor ?? theme.colors.accent;
  const swell = swellFrames ?? m.enterFrames;
  const holdFrames = hold ?? Math.round(m.fps * 0.3);
  const fadeFrames = swell * 2;
  const total = swell + holdFrames + fadeFrames;
  const fade = tween(m.frame, m.fps, {
    from: m.delay + swell + holdFrames,
    duration: fadeFrames,
    motion: "gentle",
  });
  const level = Math.min(Math.max(m.enter, 0), 1) * (1 - fade) * (1 - m.exit) * strength;
  const sweep = Math.min(Math.max((m.frame - m.delay) / total, 0), 1);
  const direction = side === "left" ? 1 : -1;
  const reach = Math.max(width, height);
  const tones = [main, `color-mix(in srgb, ${main} 50%, ${second})`, second];

  const glows = tones.map((tone, i) => {
    const r = (key: string) => random(`${seed}-${i}-${key}`);
    const diameter = reach * (0.55 + 0.35 * r("size"));
    // Start just off the entry edge (as a share of the width) and travel most of the way across.
    const start = side === "left" ? -0.1 - 0.25 * r("start") : 1.1 + 0.25 * r("start");
    const cx = (start + direction * (0.9 + 0.4 * r("travel")) * sweep) * width;
    const cy = (0.15 + 0.7 * r("y") + (r("drift") - 0.5) * 0.3 * sweep) * height;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: cx - diameter / 2,
          top: cy - diameter / 2,
          width: diameter,
          height: diameter,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${tone}, ${alpha(tone, 0.45)} 40%, ${alpha(tone, 0)})`,
          mixBlendMode: "screen",
          opacity: level * WEIGHTS[i],
        }}
      />
    );
  });

  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden", pointerEvents: "none", ...style }}>
      <AbsoluteFill style={{ background: alpha(main, 0.2), mixBlendMode: "screen", opacity: level }} />
      {glows}
    </AbsoluteFill>
  );
}
