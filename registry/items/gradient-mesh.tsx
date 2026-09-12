/**
 * @title Gradient Mesh
 * @category backgrounds
 * @description Soft color blobs in the theme accent, highlight and surface drifting slowly over the background.
 * @duration sustained
 * @use Hero scenes, launch titles and product intros that need color and gentle motion
 * @use Behind glass cards, device frames and stat callouts
 * @avoid A still, single-color brand canvas — use `brand-solid`
 * @tags gradient, mesh, blobs, color, ambient
 * @example
 * <AbsoluteFill>
 *   <GradientMesh />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type GradientMeshProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** One blob per color; three or four look best. Defaults to accent, highlight, surface, accent. */
  colors?: string[];
  /** Blob opacity at its center, 0–1. */
  intensity?: number;
  /** Blob diameter as a share of the canvas' long side. */
  blobSize?: number;
  /** Drift speed multiplier. 0 freezes the blobs. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

/** Resting spots, kept toward the edges so the middle of the frame stays calm for text. */
const anchors = [
  [0.16, 0.2],
  [0.86, 0.26],
  [0.26, 0.86],
  [0.8, 0.8],
  [0.52, 0.06],
  [0.06, 0.58],
];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function GradientMesh({
  background,
  colors,
  intensity = 0.45,
  blobSize = 0.8,
  speed = 1,
  style,
  className,
  ...motion
}: GradientMeshProps) {
  const theme = useTheme();
  const { width, height } = useViewport();
  const m = useMotion(motion);
  const palette = colors ?? [theme.colors.accent, theme.colors.highlight, theme.colors.surface, theme.colors.accent];
  const seconds = (m.frame / m.fps) * speed;
  const size = Math.max(width, height) * blobSize;
  const strength = intensity * m.presence;

  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      {palette.map((color, index) => {
        const [ax, ay] = anchors[index % anchors.length];
        // Each blob gets its own slow period so the pattern never visibly repeats inside a scene.
        const period = 13 + index * 3.7;
        const phase = index * 1.9;
        const angle = (seconds / period) * Math.PI * 2 + phase;
        const x = (ax + 0.13 * Math.sin(angle)) * width;
        const y = (ay + 0.11 * Math.cos(angle * 0.8 + phase)) * height;
        const scale = 1 + 0.08 * Math.sin(angle * 1.3);
        const stop = (share: number) => alpha(color, clamp01(strength * share));
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              scale: String(scale),
              background: `radial-gradient(closest-side, ${stop(1)} 0%, ${stop(0.62)} 32%, ${stop(0.24)} 62%, ${stop(0.06)} 84%, ${stop(0)} 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
