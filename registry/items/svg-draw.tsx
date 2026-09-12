/**
 * @title Svg Draw
 * @category product
 * @description Draws any set of SVG paths on stroke by stroke, staggered, with an optional fill fade once each finishes.
 * @duration data-driven
 * @use A logo mark, icon or custom illustration drawing itself on screen
 * @use Sketching a diagram or shape that a `callout` or label then points at
 * @avoid A single hand-drawn circle or arrow — use `scribble-circle` or `arrow`
 * @tags svg, draw, path, icon, illustration, line art
 * @example
 * <Center>
 *   <SvgDraw viewBox="0 0 24 24" paths={["M4 12h16", "M4 6h10", "M4 18h7"]} size={220} />
 * </Center>
 */
import type React from "react";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type SvgDrawProps = MotionProps & {
  /** One or more `d` attributes, drawn in order. */
  paths: string[];
  /** Must be space- or comma-separated: `"minX minY width height"`. */
  viewBox: string;
  /** Stroke color. Defaults to the theme foreground. */
  color?: string;
  /** In `viewBox` units, not design units — it scales with the drawing, like an icon's stroke. */
  strokeWidth?: number;
  /** Frames between one path's draw and the next. Defaults to 0.15s. */
  step?: number;
  /** Rendered width in design units. Height follows the `viewBox` ratio. */
  size?: number;
  /** Fades a fill in behind each path once it finishes drawing. Omit for a stroke-only line drawing. */
  fill?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function SvgDraw({
  paths,
  viewBox,
  color,
  strokeWidth = 3,
  step,
  size = 200,
  fill,
  style,
  className,
  ...motion
}: SvgDrawProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const stroke = color ?? theme.colors.foreground;
  const frames = step ?? Math.round(m.fps * 0.15);
  const box = viewBox.split(/[\s,]+/).map(Number);
  const vbWidth = box[2];
  const vbHeight = box[3];
  const width = u(size);
  const height = vbWidth > 0 ? width * (vbHeight / vbWidth) : width;

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      style={{ opacity: 1 - m.exit, overflow: "visible", ...style }}
    >
      {paths.map((d, index) => {
        const drawn = clamp01(
          tween(m.frame, m.fps, { from: m.delay + index * frames, duration: m.enterFrames, motion: m.preset }),
        );
        const filled = fill
          ? clamp01(
              tween(m.frame, m.fps, {
                from: m.delay + index * frames + m.enterFrames,
                duration: Math.round(m.enterFrames * 0.6),
                motion: "smooth",
              }),
            )
          : 0;
        return (
          <path
            key={index}
            d={d}
            fill={fill ?? "none"}
            fillOpacity={fill ? filled : undefined}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - drawn}
            opacity={drawn > 0 ? 1 : 0}
          />
        );
      })}
    </svg>
  );
}
