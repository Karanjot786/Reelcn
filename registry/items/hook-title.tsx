/**
 * @title Hook Title
 * @category social
 * @description The opening line of a short, parked at the top of the frame with a drawn underline.
 * @duration 30
 * @use The first two seconds of a short, reel or TikTok
 * @use Restating the promise over b-roll halfway through
 * @avoid Full headlines in landscape video — use `text-reveal`
 * @tags hook, shorts, title, opening
 * @example
 * <Sequence durationInFrames={90}>
 *   <HookTitle text="Nobody tells you this about lighting" kicker="Part 3" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type HookTitleProps = MotionProps & {
  text: string;
  /** Small line above the hook: an episode number, a series name. */
  kicker?: string;
  size?: number;
  color?: string;
  accentColor?: string;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function HookTitle({
  text,
  kicker,
  size = 72,
  color,
  accentColor,
  background,
  style,
  className,
  ...motion
}: HookTitleProps) {
  const theme = useTheme();
  const { u, width, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const rule = tween(m.frame, m.fps, {
    from: m.delay + m.enterFrames * 0.5,
    duration: m.enterFrames,
    motion: m.preset,
  });
  const enter = Math.min(m.enter, 1);

  return (
    <AbsoluteFill
      className={className}
      style={{ alignItems: "center", justifyContent: "flex-start", padding: `${safe.top}px ${safe.x}px`, ...style }}
    >
      <div
        style={{
          maxWidth: width - safe.x * 2,
          padding: `${u(18)}px ${u(26)}px`,
          borderRadius: u(theme.radius),
          background: background ?? alpha(theme.colors.background, 0.72),
          textAlign: "center",
          opacity: enter * (1 - m.exit),
          translate: `0 ${(1 - enter) * -u(24)}px`,
        }}
      >
        {kicker ? (
          <div style={{ fontSize: u(size * 0.34), color: accentColor ?? theme.colors.accent, marginBottom: u(8) }}>
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(isPortrait ? size : size * 0.8),
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
            color: color ?? theme.colors.foreground,
            textWrap: "balance",
          }}
        >
          {text}
        </div>
        <div
          style={{
            height: u(6),
            marginTop: u(14),
            borderRadius: u(3),
            background: accentColor ?? theme.colors.accent,
            scale: `${Math.min(rule, 1)} 1`,
            transformOrigin: "center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
