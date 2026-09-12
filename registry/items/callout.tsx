/**
 * @title Callout
 * @category overlays
 * @description Dims the frame around a target rectangle, rings it, and points a label bubble at it from the side with the most room.
 * @duration 26
 * @use Highlighting a button, field or panel in product demos and walkthroughs
 * @use Explaining one region of a screenshot or screen recording
 * @avoid A quick pointer that leaves the rest of the frame undimmed — use `arrow`
 * @tags spotlight, highlight, tooltip, focus, product, tutorial
 * @example
 * <Sequence from={30} durationInFrames={90}>
 *   <Callout target={{ x: 65, y: 71, width: 23, height: 8 }} label="Ship it from here" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type CalloutRect = { x: number; y: number; width: number; height: number };

export type CalloutProps = MotionProps & {
  /**
   * Area to spotlight, in % of the canvas (0-100): `x`/`y` is the top-left corner, `width`/`height` the size.
   * Percentages keep the spotlight on the same UI when the canvas changes format.
   */
  target: CalloutRect;
  label?: string;
  /** Where the label sits. `auto` tries below, then above, then the roomier side, staying inside the safe zone. */
  side?: "auto" | "top" | "bottom" | "left" | "right";
  /** Space added around the target, in design units. */
  padding?: number;
  /** Corner radius in design units. Defaults to the theme radius. */
  radius?: number;
  /** How dark the surroundings get, 0-1. */
  dim?: number;
  /** Dim color. Defaults to the theme background. */
  dimColor?: string;
  /** Ring, glow and bubble color. Defaults to the theme accent. */
  accentColor?: string;
  /** Label text color. Defaults to the theme accent foreground. */
  labelColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function Callout({
  target,
  label,
  side = "auto",
  padding = 12,
  radius,
  dim = 0.72,
  dimColor,
  accentColor,
  labelColor,
  style,
  className,
  ...motion
}: CalloutProps) {
  const theme = useTheme();
  const { u, width, height, safe } = useViewport();
  const m = useMotion(motion);
  const accent = accentColor ?? theme.colors.accent;
  const pad = u(padding);
  const left = (target.x / 100) * width - pad;
  const top = (target.y / 100) * height - pad;
  const w = (target.width / 100) * width + pad * 2;
  const h = (target.height / 100) * height + pad * 2;
  const cx = left + w / 2;
  const cy = top + h / 2;
  const shown = Math.min(Math.max(m.enter, 0), 1) * (1 - m.exit);
  // The spotlight starts wide and settles onto the target.
  const grow = 1 + (1 - m.enter) * 0.6;

  const room = {
    bottom: height - safe.bottom - (top + h),
    top: top - safe.top,
    left: left - safe.x,
    right: width - safe.x - (left + w),
  };
  const placed =
    side !== "auto"
      ? side
      : room.bottom >= u(130)
        ? "bottom"
        : room.top >= u(130)
          ? "top"
          : room.left > room.right
            ? "left"
            : "right";
  const gap = u(26);
  const labelIn = tween(m.frame, m.fps, {
    from: m.delay + Math.round(m.enterFrames * 0.45),
    duration: m.enterFrames,
    motion: m.preset,
  });
  const away = (1 - labelIn) * u(18);
  const nudge =
    placed === "bottom"
      ? `0 ${away}px`
      : placed === "top"
        ? `0 ${-away}px`
        : placed === "right"
          ? `${away}px 0`
          : `${-away}px 0`;
  const pointerX = placed === "left" ? left - gap : placed === "right" ? left + w + gap : cx;
  const pointerY = placed === "top" ? top - gap : placed === "bottom" ? top + h + gap : cy;
  // Above or below: hug the target's side of the canvas so the pointer always lands on the bubble.
  const bubble: React.CSSProperties =
    placed === "top" || placed === "bottom"
      ? {
          ...(placed === "bottom" ? { top: top + h + gap } : { bottom: height - top + gap }),
          ...(cx < width * 0.35
            ? { left: Math.max(safe.x, cx - u(48)) }
            : cx > width * 0.65
              ? { right: Math.max(safe.x, width - cx - u(48)) }
              : { left: cx, translate: "-50% 0" }),
          maxWidth: Math.min(u(560), width - safe.x * 2),
        }
      : {
          ...(placed === "right" ? { left: left + w + gap } : { right: width - left + gap }),
          top: cy,
          translate: "0 -50%",
          maxWidth: Math.max(room[placed] - gap, u(200)),
        };

  return (
    <AbsoluteFill className={className} style={{ pointerEvents: "none", fontFamily: theme.fonts.body, ...style }}>
      <div
        style={{
          position: "absolute",
          left: cx - (w * grow) / 2,
          top: cy - (h * grow) / 2,
          width: w * grow,
          height: h * grow,
          borderRadius: u(radius ?? theme.radius),
          // Ring, then glow, then a spread wide enough to dim the whole canvas around the hole.
          boxShadow: [
            `0 0 0 ${u(4)}px ${alpha(accent, shown)}`,
            `0 0 ${u(40)}px ${u(6)}px ${alpha(accent, 0.45 * shown)}`,
            `0 0 0 ${Math.max(width, height) * 2}px ${alpha(dimColor ?? theme.colors.background, dim * shown)}`,
          ].join(", "),
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: Math.min(Math.max(labelIn, 0), 1) * (1 - m.exit),
            translate: nudge,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "max-content",
              ...bubble,
              padding: `${u(16)}px ${u(26)}px`,
              borderRadius: u(Math.max(theme.radius * 0.6, 8)),
              background: accent,
              color: labelColor ?? theme.colors.accentForeground,
              fontFamily: theme.fonts.heading,
              fontSize: u(30),
              fontWeight: theme.headingWeight,
              lineHeight: 1.25,
              boxShadow: `0 ${u(14)}px ${u(40)}px ${alpha("#000000", 0.3)}`,
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              left: pointerX - u(10),
              top: pointerY - u(10),
              width: u(20),
              height: u(20),
              borderRadius: u(3),
              background: accent,
              rotate: "45deg",
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
}
