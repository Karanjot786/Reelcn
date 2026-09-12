/**
 * @title Split Screen
 * @category motion
 * @description Two to four full-bleed panes that wipe in one after another, each laid out as if it were its own canvas.
 * @duration 30
 * @use Before and after, side-by-side comparisons, reaction layouts and multi-angle shots
 * @use Showing the same component at two sizes, since each pane has its own viewport
 * @avoid Arranging several small cards on one canvas, use `bento-grid`
 * @tags split, compare, panes, side by side, grid
 * @example
 * <SplitScreen labels={["Before", "After"]}>
 *   <Img src={staticFile("before.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 *   <Img src={staticFile("after.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 * </SplitScreen>
 */
import type React from "react";
import { Children } from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport, Viewport } from "./core";

export type SplitScreenProps = MotionProps & {
  /** Two to four panes. Extra children are ignored. */
  children: React.ReactNode;
  /** One label per pane, shown in its top-left corner. */
  labels?: string[];
  /** `auto` puts two or three panes side by side (stacked in portrait) and four in a 2×2 grid. */
  layout?: "auto" | "row" | "column" | "grid";
  /** Frames between one pane's wipe and the next. Defaults to 0.12s. */
  step?: number;
  /** Pane fill behind the children. Defaults to the theme surface. */
  background?: string;
  /** Hairline between panes. Defaults to the theme border. */
  dividerColor?: string;
  /** Label text. Defaults to the theme foreground. */
  labelColor?: string;
  /** Label fill. Defaults to the theme background at 70%. */
  labelBackground?: string;
  style?: React.CSSProperties;
  className?: string;
};

type Rect = { left: number; top: number; width: number; height: number; row: number; column: number };

/** Pixel rectangles for each pane; a short last row stretches to fill the width. */
function paneRects(count: number, columns: number, width: number, height: number): Rect[] {
  const rows = Math.ceil(count / columns);
  const rects: Rect[] = [];
  for (let index = 0; index < count; index++) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const inRow = Math.min(columns, count - row * columns);
    const paneWidth = width / inRow;
    rects.push({
      left: column * paneWidth,
      top: (row * height) / rows,
      width: paneWidth,
      height: height / rows,
      row,
      column,
    });
  }
  return rects;
}

export function SplitScreen({
  children,
  labels = [],
  layout = "auto",
  step,
  background,
  dividerColor,
  labelColor,
  labelBackground,
  style,
  className,
  ...motion
}: SplitScreenProps) {
  const theme = useTheme();
  const { width, height, u, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const panes = Children.toArray(children).slice(0, 4);
  const shape = layout === "auto" ? (panes.length === 4 ? "grid" : isPortrait ? "column" : "row") : layout;
  const columns = shape === "grid" ? 2 : shape === "row" ? panes.length : 1;
  const rects = paneRects(panes.length, columns, width, height);
  const frames = step ?? Math.round(m.fps * 0.12);
  // Side-by-side panes wipe downward; stacked panes wipe across.
  const vertical = columns > 1;

  return (
    <AbsoluteFill className={className} style={{ fontFamily: theme.fonts.body, ...style }}>
      {panes.map((pane, index) => {
        const rect = rects[index];
        const p = tween(m.frame, m.fps, { from: m.delay + index * frames, duration: m.enterFrames, motion: m.preset });
        const shown = Math.min(Math.max(p, 0), 1);
        const labelIn = tween(m.frame, m.fps, {
          from: m.delay + index * frames + m.enterFrames * 0.4,
          duration: m.enterFrames,
          motion: m.preset,
        });
        const enterEdge = `${(1 - shown) * 100}%`;
        const exitEdge = `${m.exit * 100}%`;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              overflow: "hidden",
              background: background ?? theme.colors.surface,
              // Enter wipes in from the leading edge; exit carries the same wipe on through the far edge.
              clipPath: vertical ? `inset(${exitEdge} 0 ${enterEdge} 0)` : `inset(0 ${enterEdge} 0 ${exitEdge})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                scale: String(1 + 0.08 * (1 - shown)),
              }}
            >
              <Viewport width={rect.width} height={rect.height}>
                {pane}
              </Viewport>
            </div>
            {rect.column > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: dividerColor ?? theme.colors.border,
                }}
              />
            )}
            {rect.row > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 1,
                  background: dividerColor ?? theme.colors.border,
                }}
              />
            )}
            {labels[index] && (
              <div
                style={{
                  position: "absolute",
                  left: u(40),
                  top: isPortrait && rect.row === 0 ? safe.top : u(40),
                  padding: `${u(10)}px ${u(22)}px`,
                  borderRadius: u(theme.radius),
                  border: `1px solid ${dividerColor ?? theme.colors.border}`,
                  background: labelBackground ?? alpha(theme.colors.background, 0.7),
                  color: labelColor ?? theme.colors.foreground,
                  fontSize: u(28),
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  opacity: Math.min(Math.max(labelIn, 0), 1),
                  translate: `0 ${(1 - labelIn) * u(16)}px`,
                }}
              >
                {labels[index]}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
