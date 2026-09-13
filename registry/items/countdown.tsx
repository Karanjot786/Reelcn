/**
 * @title Countdown
 * @category social
 * @description A ring that empties while the number counts down to zero.
 * @duration data-driven
 * @use Waiting rooms and "starting soon" cards for streams
 * @use Timed challenges inside a video
 * @tags countdown, timer, ring, stream
 * @example
 * <Sequence durationInFrames={150}>
 *   <Countdown seconds={5} label="Starting in" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type CountdownProps = MotionProps & {
  seconds: number;
  label?: string;
  /** Text shown for one second after zero. */
  doneLabel?: string;
  size?: number;
  color?: string;
  accentColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function Countdown({
  seconds,
  label,
  doneLabel = "Go",
  size = 260,
  color,
  accentColor,
  style,
  className,
  ...motion
}: CountdownProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const elapsed = Math.max(0, (m.frame - m.delay) / m.fps);
  const remaining = Math.max(0, seconds - elapsed);
  const progress = interpolate(remaining, [0, seconds], [0, 1], CLAMP);
  const diameter = u(size);
  const stroke = u(14);
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // The number pops as each second turns over.
  const tick = 1 - (remaining % 1);
  const pop = remaining > 0 ? 1 + Math.max(0, 0.12 - tick * 0.12) : 1;

  return (
    <AbsoluteFill
      className={className}
      style={{ alignItems: "center", justifyContent: "center", gap: u(18), opacity: 1 - m.exit, ...style }}
    >
      {label ? <div style={{ fontSize: u(28), color: theme.colors.muted }}>{label}</div> : null}
      <div style={{ position: "relative", width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} aria-hidden="true">
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={theme.colors.border}
            strokeWidth={stroke}
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={accentColor ?? theme.colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(size * 0.42),
            fontVariantNumeric: "tabular-nums",
            color: color ?? theme.colors.foreground,
            scale: String(pop),
          }}
        >
          {remaining > 0 ? Math.ceil(remaining) : doneLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
}
