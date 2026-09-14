/**
 * @title Screen Zoom
 * @category product
 * @description Zooms and pans across whatever you wrap so a rectangle of the content — a button, a chart, a card — fills the frame, eased between keyframes.
 * @duration data-driven
 * @use Pushing in on a detail inside a `browser-window`, `app-window` or dashboard mockup
 * @use A guided tour that visits several parts of the same screen in turn
 * @avoid Panning and zooming over a photo or footage with pixel offsets — use `camera`
 * @tags zoom, pan, focus, screen, product, tour
 * @example
 * <BrowserWindow url="app.dev">
 *   <ScreenZoom
 *     focus={[
 *       { frame: 0, x: 0, y: 0, width: 100, height: 100 },
 *       { frame: 40, x: 55, y: 30, width: 30, height: 24 },
 *     ]}
 *   >
 *     <Dashboard />
 *   </ScreenZoom>
 * </BrowserWindow>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { type MotionProps, type PoseKey, useKeyframePath, useMotion } from "./core";

export type ScreenZoomFocus = {
  /** Frame the frame finishes arriving here, counted from `delay`. */
  frame: number;
  /** Rectangle to fill the canvas with, in % of the content (0–100 on each axis). */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Timing comes from `focus`. Of the motion props, `delay` shifts every keyframe and `motion` picks the easing
 * between them; `exit` is off by default so the zoom holds its last keyframe.
 */
export type ScreenZoomProps = MotionProps & {
  focus: ScreenZoomFocus[];
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const REST: ScreenZoomFocus = { frame: 0, x: 0, y: 0, width: 100, height: 100 };

export function ScreenZoom({ focus, exit = false, children, style, className, ...motion }: ScreenZoomProps) {
  const m = useMotion({ ...motion, exit });
  const points = focus.slice().sort((a, b) => a.frame - b.frame);
  const keys: PoseKey[] = points.map((p) => ({ frame: m.delay + p.frame, x: p.x, y: p.y, width: p.width, height: p.height }));
  const path = useKeyframePath(keys, { motion: m.preset });
  const rect: ScreenZoomFocus =
    points.length > 0
      ? { frame: path.frame, x: path.x, y: path.y, width: path.width ?? 100, height: path.height ?? 100 }
      : REST;

  // Percentage translate is resolved against this element's own box, so the math holds whether ScreenZoom
  // fills the whole canvas or sits nested inside a smaller frame like `browser-window`.
  const scale = Math.min(100 / Math.max(rect.width, 1), 100 / Math.max(rect.height, 1));
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden", opacity: 1 - m.exit, ...style }}>
      <AbsoluteFill
        style={{ transformOrigin: "50% 50%", transform: `scale(${scale}) translate(${50 - cx}%, ${50 - cy}%)` }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
