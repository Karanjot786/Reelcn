/**
 * @title Redact
 * @category product
 * @description Covers one or more rectangles with an opaque fill and a blur or pixelate effect on top — the opaque fill always renders, so the region is covered even if the effect layer doesn't.
 * @duration 1
 * @use Hiding an API key, email or account number in a real screenshot or screen recording
 * @use Covering a sensitive panel in a dashboard demo without cropping it out
 * @avoid A region that should stay fully visible — this always covers, never partially
 * @tags redact, blur, pixelate, privacy, censor
 * @example
 * <BrowserWindow url="app.dev">
 *   <Dashboard />
 *   <Redact rects={[{ x: 62, y: 18, width: 22, height: 6 }]} mode="pixelate" />
 * </BrowserWindow>
 */
import type React from "react";
import { useId } from "react";
import { AbsoluteFill } from "remotion";
import type { CalloutRect } from "./callout";
import { type MotionProps, redactRectBudget, useMotion, useTheme, useViewport } from "./core";

export type RedactProps = MotionProps & {
  /** Areas to cover, in % of canvas — same shape `callout`'s `target` uses. At most 8 (`redactRectBudget`). */
  rects: CalloutRect[];
  mode?: "pixelate" | "blur";
  /** Blur radius, or pixelate cell size, in design units. */
  cellSize?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function Redact({ rects, mode = "blur", cellSize = 18, style, className, ...motion }: RedactProps) {
  redactRectBudget(rects.length);
  const theme = useTheme();
  const { u, width, height } = useViewport();
  const m = useMotion(motion);
  const filterId = `redact-pixelate-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const cellPx = u(cellSize);

  return (
    <AbsoluteFill className={className} style={{ pointerEvents: "none", opacity: m.presence, ...style }}>
      {mode === "pixelate" ? (
        <svg aria-hidden="true" width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feFlood x="0" y="0" width={cellPx} height={cellPx} />
              <feComposite width={cellPx * 2} height={cellPx * 2} />
              <feTile result="grid" />
              <feComposite in="SourceGraphic" in2="grid" operator="in" />
              <feMorphology operator="dilate" radius={cellPx / 2} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {rects.map((rect, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (rect.x / 100) * width,
            top: (rect.y / 100) * height,
            width: (rect.width / 100) * width,
            height: (rect.height / 100) * height,
            overflow: "hidden",
          }}
        >
          {/* Fail-opaque base: always rendered, always fully opaque. See Deviation 6 for the z-order spike
              this needs before the effect layer below can be trusted to show real content through it. */}
          <div style={{ position: "absolute", inset: 0, background: theme.colors.background }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: mode === "blur" ? `blur(${cellPx}px)` : `url(#${filterId})`,
              WebkitBackdropFilter: mode === "blur" ? `blur(${cellPx}px)` : `url(#${filterId})`,
            }}
          />
        </div>
      ))}
    </AbsoluteFill>
  );
}
