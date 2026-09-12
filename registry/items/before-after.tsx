/**
 * @title Before After
 * @category product
 * @description Comparison slider: a divider with a handle wipes from one position to another, revealing "after" past it.
 * @duration 45
 * @use Redesigns, edits and upgrades — anything with a clear before and after state
 * @use A single screenshot that changes at one point, rather than two panes shown at once
 * @avoid Two panes shown side by side the whole time — use `split-screen`
 * @tags before after, comparison, slider, diff, reveal
 * @example
 * <BeforeAfter labels={["Before", "After"]} before={<OldUI />} after={<NewUI />} />
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport, Viewport } from "./core";

export type BeforeAfterProps = MotionProps & {
  /** Content left of the divider. */
  before: React.ReactNode;
  /** Content right of the divider. */
  after: React.ReactNode;
  /** Divider's resting position, in % of width (0–100). Defaults to 50. */
  to?: number;
  /** Divider's starting position before the wipe, in % of width. Defaults to 100 (fully "before"). */
  from?: number;
  /** Corner labels: `[beforeLabel, afterLabel]`. */
  labels?: [string, string];
  dividerColor?: string;
  handleColor?: string;
  labelColor?: string;
  labelBackground?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function BeforeAfter({
  before,
  after,
  to = 50,
  from = 100,
  labels,
  dividerColor,
  handleColor,
  labelColor,
  labelBackground,
  style,
  className,
  ...motion
}: BeforeAfterProps) {
  const theme = useTheme();
  const { width, height, u, safe } = useViewport();
  const m = useMotion(motion);
  const progress = clamp01(m.enter);
  const divider = from + (to - from) * progress;
  const line = dividerColor ?? theme.colors.background;
  const handle = handleColor ?? theme.colors.foreground;

  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden", opacity: 1 - m.exit, ...style }}>
      <Viewport width={width} height={height}>
        {before}
      </Viewport>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${divider}%)` }}>
        <Viewport width={width} height={height}>
          {after}
        </Viewport>
      </div>
      <div
        style={{
          position: "absolute",
          left: `${divider}%`,
          top: 0,
          bottom: 0,
          width: u(4),
          marginLeft: -u(2),
          background: line,
          boxShadow: `0 0 0 1px ${alpha("#000000", 0.2)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${divider}%`,
          top: "50%",
          width: u(56),
          height: u(56),
          borderRadius: "50%",
          translate: "-50% -50%",
          background: handle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 ${u(10)}px ${u(28)}px ${alpha("#000000", 0.35)}`,
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={u(26)}
          height={u(26)}
          fill="none"
          stroke={theme.colors.background}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </div>
      {labels && (
        <>
          <div
            style={{
              position: "absolute",
              left: safe.x,
              top: safe.top,
              padding: `${u(8)}px ${u(18)}px`,
              borderRadius: u(theme.radius),
              background: labelBackground ?? alpha(theme.colors.background, 0.7),
              color: labelColor ?? theme.colors.foreground,
              fontFamily: theme.fonts.body,
              fontSize: u(24),
              fontWeight: 600,
              opacity: progress,
            }}
          >
            {labels[0]}
          </div>
          <div
            style={{
              position: "absolute",
              right: safe.x,
              top: safe.top,
              padding: `${u(8)}px ${u(18)}px`,
              borderRadius: u(theme.radius),
              background: labelBackground ?? alpha(theme.colors.background, 0.7),
              color: labelColor ?? theme.colors.foreground,
              fontFamily: theme.fonts.body,
              fontSize: u(24),
              fontWeight: 600,
              opacity: progress,
            }}
          >
            {labels[1]}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
}
