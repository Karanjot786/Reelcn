/**
 * @title Quote Card
 * @category social
 * @description A pulled quote with its attribution, and an oversized quote mark drawn behind it.
 * @duration 40
 * @use Customer praise and testimonials
 * @use Lifting one line out of an interview
 * @avoid A social post with engagement counts — use `post-card`
 * @tags quote, testimonial, praise, card
 * @example
 * <Center>
 *   <QuoteCard quote="We cut a week of editing down to an afternoon." name="Grace Hopper" role="Head of Video" />
 * </Center>
 */
import type React from "react";
import { alpha, graphemeInitial, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type QuoteCardProps = MotionProps & {
  quote: string;
  name: string;
  role?: string;
  /** Avatar image; pass an `<Img>`. Initials are drawn when omitted. */
  avatar?: React.ReactNode;
  width?: number;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function QuoteCard({
  quote,
  name,
  role,
  avatar,
  width = 820,
  size = 44,
  style,
  className,
  ...motion
}: QuoteCardProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const enter = Math.min(m.enter, 1);
  const attribution = Math.min(
    tween(m.frame, m.fps, { from: m.delay + Math.round(m.fps * 0.35), duration: m.enterFrames, motion: m.preset }),
    1,
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: u(width),
        maxWidth: "100%",
        padding: u(36),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.foreground,
        overflow: "hidden",
        opacity: enter * (1 - m.exit),
        translate: `0 ${(1 - enter) * u(22)}px`,
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: u(-30),
          left: u(12),
          fontFamily: theme.fonts.heading,
          fontSize: u(220),
          lineHeight: 1,
          color: alpha(theme.colors.accent, 0.16),
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          position: "relative",
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(size),
          lineHeight: 1.28,
          letterSpacing: "-0.02em",
          textWrap: "pretty",
        }}
      >
        {quote}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: u(14),
          marginTop: u(26),
          opacity: attribution,
          translate: `0 ${(1 - attribution) * u(10)}px`,
        }}
      >
        <div
          style={{
            width: u(52),
            height: u(52),
            borderRadius: "50%",
            overflow: "hidden",
            background: theme.colors.accent,
            color: theme.colors.accentForeground,
            display: "grid",
            placeItems: "center",
            fontSize: u(22),
            fontWeight: 700,
          }}
        >
          {avatar ?? graphemeInitial(name)}
        </div>
        <div>
          <div style={{ fontSize: u(24), fontWeight: 650 }}>{name}</div>
          {role ? <div style={{ fontSize: u(20), color: theme.colors.muted }}>{role}</div> : null}
        </div>
      </div>
    </div>
  );
}
