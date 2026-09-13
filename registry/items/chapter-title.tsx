/**
 * @title Chapter Title
 * @category social
 * @description A numbered chapter card that wipes in over the footage and leaves again.
 * @duration 36
 * @use Section breaks in tutorials and long-form video
 * @use Naming the step a viewer is about to watch
 * @avoid A speaker's name — use `lower-third`
 * @tags chapter, section, divider, tutorial
 * @example
 * <Sequence from={300} durationInFrames={110}>
 *   <ChapterTitle number={2} title="Setting the key light" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type ChapterTitleProps = MotionProps & {
  title: string;
  number?: number;
  /** Where the card sits vertically. */
  align?: "center" | "bottom";
  color?: string;
  accentColor?: string;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function ChapterTitle({
  title,
  number,
  align = "center",
  color,
  accentColor,
  background,
  style,
  className,
  ...motion
}: ChapterTitleProps) {
  const theme = useTheme();
  const { u, safe } = useViewport();
  const m = useMotion(motion);
  const wipe = Math.min(tween(m.frame, m.fps, { from: m.delay, duration: m.enterFrames, motion: m.preset }), 1);
  const text = Math.min(
    tween(m.frame, m.fps, { from: m.delay + Math.round(m.fps * 0.18), duration: m.enterFrames, motion: m.preset }),
    1,
  );

  return (
    <AbsoluteFill
      className={className}
      style={{
        alignItems: "flex-start",
        justifyContent: align === "bottom" ? "flex-end" : "center",
        padding: `0 ${safe.x}px ${align === "bottom" ? safe.bottom : 0}px`,
        opacity: 1 - m.exit,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: u(20),
          padding: `${u(18)}px ${u(28)}px`,
          borderRadius: u(theme.radius),
          background: background ?? alpha(theme.colors.surface, 0.92),
          border: `1px solid ${theme.colors.border}`,
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round ${u(theme.radius)}px)`,
        }}
      >
        {number === undefined ? null : (
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: u(42),
              fontVariantNumeric: "tabular-nums",
              color: accentColor ?? theme.colors.accent,
            }}
          >
            {number < 10 ? `0${number}` : number}
          </div>
        )}
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(44),
            letterSpacing: "-0.02em",
            color: color ?? theme.colors.foreground,
            opacity: text,
            translate: `0 ${(1 - text) * u(10)}px`,
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
}
