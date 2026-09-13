/**
 * @title Subscribe CTA
 * @category social
 * @description A subscribe button that presses itself, with a bell that rings once after the click.
 * @duration 45
 * @use The last five seconds of a video, or right after a payoff
 * @use Any moment that asks for one specific action
 * @avoid Several competing asks at once — show one call to action
 * @tags cta, subscribe, bell, youtube
 * @example
 * <Sequence from={120} durationInFrames={90}>
 *   <SubscribeCta label="Subscribe" note="New videos every Thursday" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type SubscribeCtaProps = MotionProps & {
  label?: string;
  /** Line under the button. */
  note?: string;
  /** Frame, relative to this component, when the button presses itself. */
  pressAt?: number;
  color?: string;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function SubscribeCta({
  label = "Subscribe",
  note,
  pressAt,
  color,
  background,
  style,
  className,
  ...motion
}: SubscribeCtaProps) {
  const theme = useTheme();
  const { u, safe } = useViewport();
  const m = useMotion(motion);
  const press = pressAt ?? Math.round(m.fps * 0.9);
  const down = tween(m.frame, m.fps, { from: press, duration: Math.round(m.fps * 0.12), motion: "snappy" });
  const up = tween(m.frame, m.fps, {
    from: press + Math.round(m.fps * 0.12),
    duration: Math.round(m.fps * 0.2),
    motion: "bouncy",
  });
  const ring = tween(m.frame, m.fps, {
    from: press + Math.round(m.fps * 0.2),
    duration: Math.round(m.fps * 0.5),
    motion: "linear",
  });
  // One ring: the bell rocks twice and settles.
  const tilt = ring > 0 && ring < 1 ? Math.sin(ring * Math.PI * 4) * (1 - ring) * 16 : 0;
  const enter = Math.min(m.enter, 1);

  return (
    <AbsoluteFill
      className={className}
      style={{ alignItems: "center", justifyContent: "flex-end", padding: `0 ${safe.x}px ${safe.bottom}px`, ...style }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: u(12),
          opacity: enter * (1 - m.exit),
          translate: `0 ${(1 - enter) * u(20)}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: u(14),
            padding: `${u(16)}px ${u(30)}px`,
            borderRadius: u(theme.radius),
            background: background ?? theme.colors.accent,
            color: color ?? theme.colors.accentForeground,
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(36),
            boxShadow: `0 ${u(14)}px ${u(40)}px ${alpha("#000000", 0.28)}`,
            scale: String(1 - down * 0.06 + up * 0.06),
          }}
        >
          <svg
            width={u(34)}
            height={u(34)}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ rotate: `${tilt}deg` }}
          >
            <path
              d="M6 9a6 6 0 1 1 12 0c0 4 1.2 5.4 2 6H4c.8-.6 2-2 2-6Z"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <span>{label}</span>
        </div>
        {note ? <div style={{ fontSize: u(24), color: theme.colors.muted }}>{note}</div> : null}
      </div>
    </AbsoluteFill>
  );
}
