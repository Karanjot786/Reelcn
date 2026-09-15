/**
 * @title Logo Sting
 * @category motion
 * @description Draws a real SVG mark in stroke order, snaps to a filled mark with one sound at the moment the last path finishes, then holds fully still for at least a second.
 * @duration data-driven
 * @use A brand's own logo mark drawing itself, not a generic "LOGO" placeholder
 * @use The opening or closing beat of `brand-reel`
 * @avoid A logo that needs to keep moving after it lands — pair with `svg-draw` directly instead
 * @tags logo, sting, draw, brand, sfx
 * @example
 * <Center>
 *   <LogoSting viewBox="0 0 48 48" paths={["M8 24 L24 8 L40 24 L24 40 Z"]} size={160} sfx="chime" />
 * </Center>
 */
import type React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { clamp01, type MotionProps, StrokeOverlay, tween, useMotion, useTheme, useViewport } from "./core";
import { Sfx, type SfxName } from "./sfx";

export type LogoStingProps = MotionProps & {
  viewBox: string;
  paths: string[];
  size?: number;
  color?: string;
  /** Fires once, the moment the last path finishes drawing. `false` for silence. */
  sfx?: SfxName | false;
  /** Minimum static hold after the snap, in frames. Defaults to `fps` (a hard ≥1s floor, M3). */
  holdFrames?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function LogoSting({
  viewBox,
  paths,
  size = 200,
  color,
  sfx = "chime",
  holdFrames,
  style,
  className,
  ...motion
}: LogoStingProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const { fps } = useVideoConfig();
  // A sting's whole point is to snap into place and hold (M3: pixel-static, logo still visible, for the
  // final second) — `useMotion`'s own default (`exit: true`) would auto-fade it out before that hold ever
  // starts, since `holdFrames` there only pulls the exit's own end *earlier*, never suppresses it. Default
  // to no exit; a caller who explicitly wants one still gets it (`exit`/`holdFrames` stay public props).
  const m = useMotion({ exit: false, ...motion, holdFrames: holdFrames ?? fps });
  const fill = color ?? theme.colors.foreground;
  const step = Math.round(m.fps * 0.15);
  const box = viewBox.split(/[\s,]+/).map(Number);
  const vbWidth = box[2];
  const vbHeight = box[3];
  const renderWidth = u(size);
  const renderHeight = vbWidth > 0 ? renderWidth * (vbHeight / vbWidth) : renderWidth;
  const lastDrawEnd = m.delay + (paths.length - 1) * step + m.enterFrames;
  const snap = clamp01(
    tween(m.frame, m.fps, { from: lastDrawEnd, duration: Math.round(m.fps * 0.25), motion: "snappy" }),
  );

  return (
    <>
      <svg
        aria-hidden="true"
        className={className}
        width={renderWidth}
        height={renderHeight}
        viewBox={viewBox}
        style={{ opacity: 1 - m.exit, overflow: "visible", ...style }}
      >
        {paths.map((d, index) => {
          const drawn = Math.max(
            0,
            Math.min(
              1,
              tween(m.frame, m.fps, { from: m.delay + index * step, duration: m.enterFrames, motion: m.preset }),
            ),
          );
          return (
            <g key={index} opacity={drawn > 0 ? 1 : 0}>
              <path d={d} fill={fill} fillOpacity={snap} stroke="none" />
              <StrokeOverlay
                d={d}
                kind={theme.stroke}
                seed={`logo-sting-${index}`}
                color={fill}
                strokeWidth={3}
                drawn={drawn}
                extraProps={{ strokeLinecap: "round", strokeLinejoin: "round", strokeOpacity: 1 - snap }}
              />
            </g>
          );
        })}
      </svg>
      {sfx !== false ? (
        <Sequence from={Math.max(0, lastDrawEnd)}>
          <Sfx name={sfx} />
        </Sequence>
      ) : null}
    </>
  );
}
