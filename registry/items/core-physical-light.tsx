/**
 * @title Core Physical Light
 * @category lib
 * @description Shared "physical light" background looks for midnight/paper/neon/mono, reused by aurora, gradient-mesh, beams and spotlight. Not a catalog item on its own — each background item still owns its per-theme LOOK_BY_THEME mapping and its own default (curtains/blobs/shafts/pool) look for daylight/sunset.
 * @tags background, light, grain, grid, theme
 * @example
 * <GridSweepLook theme={theme} seconds={seconds} strength={0.6} background={theme.colors.background} />
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type Theme, useViewport } from "./core";
import { Grain } from "./grain";

export type PhysicalLightProps = {
  theme: Theme;
  seconds: number;
  /** Overall strength, 0-1 (each caller's own `intensity * m.presence`, optionally scaled down for a background meant to sit further behind foreground content). */
  strength: number;
  palette?: string[];
  background?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Blueprint direction: a faint animated grid with one sweeping highlight line. */
export function GridSweepLook({ theme, seconds, strength, background, className, style }: PhysicalLightProps) {
  const { u, width } = useViewport();
  const gridSize = u(64);
  const sweepX = ((seconds * u(120)) % (width + gridSize)) - gridSize / 2;
  return (
    <AbsoluteFill
      className={className}
      style={{ background: background ?? theme.colors.background, overflow: "hidden", ...style }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${alpha(theme.colors.border, 0.14)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.colors.border, 0.14)} 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          opacity: strength,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: sweepX,
          top: 0,
          width: u(2.5),
          height: "100%",
          background: alpha(theme.colors.border, strength * 1.4),
        }}
      />
    </AbsoluteFill>
  );
}

/** Paper direction: a fibre-grain field reading `theme.material.grain`. */
export function GrainFieldLook({ theme, strength, background, className, style }: PhysicalLightProps) {
  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      <Grain opacity={(theme.material?.grain ?? 0.35) * strength} blend="multiply" />
    </AbsoluteFill>
  );
}

/** Pop direction: flat color blocks that shift between the palette's hues, no glow, no blur-halo. */
export function FlatBlocksLook({
  theme,
  seconds,
  strength,
  palette = [theme.colors.accent],
  background,
  className,
  style,
}: PhysicalLightProps) {
  const hueIndex = Math.floor((seconds / 9) % palette.length);
  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      <AbsoluteFill style={{ background: alpha(palette[hueIndex % palette.length], strength) }} />
    </AbsoluteFill>
  );
}

/** Signal direction: one flat plane, motion (if any) is a single moving accent shape, not light. */
export function FlatAccentLook({ theme, seconds, strength, background, className, style }: PhysicalLightProps) {
  const { u, width, height } = useViewport();
  const accentX = 0.5 + 0.35 * Math.sin(seconds * 0.3);
  return (
    <AbsoluteFill className={className} style={{ background: background ?? theme.colors.background, ...style }}>
      <div
        style={{
          position: "absolute",
          left: accentX * width - u(40),
          top: height * 0.5 - u(40),
          width: u(80),
          height: u(80),
          borderRadius: u(theme.radius),
          background: alpha(theme.colors.accent, strength),
        }}
      />
    </AbsoluteFill>
  );
}
