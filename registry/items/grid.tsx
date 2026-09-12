/**
 * @title Grid
 * @category backgrounds
 * @description Line grid that pans slowly, or a perspective floor that scrolls toward the viewer and fades into a glowing horizon.
 * @duration sustained
 * @use Tech, developer and product scenes that want structure behind the content
 * @use Retro or futuristic openers with the perspective floor
 * @avoid A soft dotted texture — use `dots`
 * @tags grid, lines, blueprint, perspective, synthwave, floor
 * @example
 * <AbsoluteFill>
 *   <Grid perspective />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type GridProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Line color. Defaults to the theme border (flat) or a translucent accent (perspective). */
  color?: string;
  /** Draw a 3D floor receding to a horizon instead of a flat panning grid. */
  perspective?: boolean;
  /** Cell size in design units. Defaults to 80 flat, 110 in perspective. */
  cell?: number;
  /** Line width in design units. */
  lineWidth?: number;
  /** Horizon height as a share of the canvas height (perspective only). */
  horizon?: number;
  /** Glow along the horizon (perspective only). Defaults to the theme accent; pass "transparent" to remove it. */
  glowColor?: string;
  /** How strongly the grid fades toward the edges (flat) or into the horizon (perspective), 0–1. */
  fade?: number;
  /** Line opacity multiplier, 0–1. */
  opacity?: number;
  /** Pan or scroll speed multiplier. 0 holds the grid still. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const n = (value: number) => value.toFixed(2);

/** Share of the floor depth below which lines are dropped; the fog is fully opaque there, so nothing pops. */
const NEAREST_REL = 0.1;

function flatPath(width: number, height: number, cellPx: number, seconds: number) {
  // Lines stay centered on the canvas and drift diagonally by a fraction of a cell each second.
  const shift = (seconds * 0.3 * cellPx) % cellPx;
  const startX = ((width / 2 + shift) % cellPx) - cellPx;
  const startY = ((height / 2 + shift * 0.6) % cellPx) - cellPx;
  let d = "";
  for (let x = startX; x <= width + cellPx; x += cellPx) d += `M${n(x)} 0V${n(height)}`;
  for (let y = startY; y <= height + cellPx; y += cellPx) d += `M0 ${n(y)}H${n(width)}`;
  return d;
}

function floorPath(width: number, height: number, cellPx: number, horizonY: number, seconds: number) {
  // Pinhole projection of a flat floor: the bottom edge of the canvas is depth 0, the horizon is infinitely far.
  const eye = height - horizonY;
  const focal = eye;
  const maxDepth = focal * (1 / NEAREST_REL - 1);
  const phase = (seconds * 0.6) % 1;
  const cx = width / 2;
  let d = "";
  for (let k = 0; ; k++) {
    const z = (k - phase) * cellPx;
    if (z > maxDepth) break;
    if (z < 0) continue;
    const y = horizonY + (eye * focal) / (focal + z);
    d += `M0 ${n(y)}H${n(width)}`;
  }
  const columns = Math.ceil(width / 2 / NEAREST_REL / cellPx) + 1;
  for (let j = -columns; j <= columns; j++) {
    const x = j * cellPx;
    d += `M${n(cx + x)} ${n(height)}L${n(cx + x * NEAREST_REL)} ${n(horizonY + eye * NEAREST_REL)}`;
  }
  return d;
}

export function Grid({
  background,
  color,
  perspective = false,
  cell,
  lineWidth = 2,
  horizon = 0.5,
  glowColor,
  fade = 0.6,
  opacity = 1,
  speed = 1,
  style,
  className,
  ...motion
}: GridProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const base = background ?? theme.colors.background;
  const seconds = (m.frame / m.fps) * speed;
  const cellPx = Math.max(u(cell ?? (perspective ? 110 : 80)), 4);
  const stroke = color ?? (perspective ? alpha(theme.colors.accent, 0.55) : theme.colors.border);
  const lineOpacity = clamp01(opacity) * m.presence;

  if (!perspective) {
    const inner = (1 - clamp01(fade)) * 90;
    const mask =
      fade > 0 ? `radial-gradient(ellipse farthest-corner at 50% 50%, black ${inner}%, transparent 100%)` : undefined;
    return (
      <AbsoluteFill className={className} style={{ background: base, ...style }}>
        <svg
          width={width}
          height={height}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask }}
        >
          <path
            d={flatPath(width, height, cellPx, seconds)}
            fill="none"
            stroke={stroke}
            strokeWidth={u(lineWidth)}
            opacity={lineOpacity}
          />
        </svg>
      </AbsoluteFill>
    );
  }

  const horizonY = height * horizon;
  const eye = height - horizonY;
  // Fog in the background color hides the densest far lines; `fade` stretches it toward the viewer.
  const fogEnd = 16 + clamp01(fade) * 44;
  const glow = alpha(glowColor ?? theme.colors.accent, 0.3 * m.presence);

  return (
    <AbsoluteFill className={className} style={{ background: base, ...style }}>
      <svg width={width} height={height} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        <path
          d={floorPath(width, height, cellPx, horizonY, seconds)}
          fill="none"
          stroke={stroke}
          strokeWidth={u(lineWidth)}
          opacity={lineOpacity}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: horizonY - 1,
          height: eye + 1,
          background: `linear-gradient(180deg, ${base} 0%, ${base} 14%, ${alpha(base, 0)} ${fogEnd}%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${width * 0.55}px ${eye * 0.45}px at 50% ${horizonY}px, ${glow} 0%, ${alpha(glowColor ?? theme.colors.accent, 0)} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}
