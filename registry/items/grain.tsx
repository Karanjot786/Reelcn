/**
 * @title Grain
 * @category backgrounds
 * @description Animated film-grain overlay from SVG noise that re-seeds every few frames; place it last, over anything.
 * @duration sustained
 * @use A filmic, tactile finish over gradients, footage and flat color
 * @use Breaking up banding in dark gradients such as `gradient-mesh` or `aurora`
 * @tags grain, noise, film, texture, overlay
 * @example
 * <AbsoluteFill>
 *   <GradientMesh />
 *   <Center><TextReveal text="Hello" /></Center>
 *   <Grain />
 * </AbsoluteFill>
 */
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useViewport } from "./core";

export type GrainProps = {
  /** Overall strength, 0–1. */
  opacity?: number;
  /** How the grain combines with what is under it. `overlay` and `soft-light` suit mid-tone footage. */
  blend?: React.CSSProperties["mixBlendMode"];
  /** Grain size in design units. */
  size?: number;
  /** Frames each grain pattern holds before re-seeding; 1 boils every frame. */
  every?: number;
  /** Starting seed; change it to get a different grain sequence. */
  seed?: number;
  style?: React.CSSProperties;
  className?: string;
};

// Luminance to all three channels with an opaque alpha: gray, not colored, noise.
const GRAY = "0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1";
// fractalNoise clusters around mid-gray; stretch it so the grain spans dark to light.
const CONTRAST = { type: "linear", slope: 2.4, intercept: -0.7 } as const;

export function Grain({
  opacity = 0.08,
  blend = "normal",
  size = 1.4,
  every = 2,
  seed = 0,
  style,
  className,
}: GrainProps) {
  const frame = useCurrentFrame();
  const { u } = useViewport();
  // useId output contains characters that break url(#...) references in some React versions.
  const id = `reelcn-grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const step = Math.floor(frame / Math.max(1, Math.round(every)));

  return (
    <AbsoluteFill
      className={className}
      style={{ pointerEvents: "none", opacity: Math.min(Math.max(opacity, 0), 1), mixBlendMode: blend, ...style }}
    >
      <svg width="100%" height="100%" aria-hidden="true">
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.7 / Math.max(u(size), 0.25)}
            numOctaves={2}
            seed={seed + step}
            stitchTiles="stitch"
          />
          <feColorMatrix type="matrix" values={GRAY} />
          <feComponentTransfer>
            <feFuncR {...CONTRAST} />
            <feFuncG {...CONTRAST} />
            <feFuncB {...CONTRAST} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
}
