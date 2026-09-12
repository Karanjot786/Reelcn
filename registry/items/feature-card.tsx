/**
 * @title Feature Card
 * @category product
 * @description Icon, title, body copy and an optional badge on a themed card that rises into place.
 * @duration 24
 * @use One feature at a time in a launch video, or several staggered inside `stagger` or `bento-grid`
 * @use A pricing tier or plan card with a "New" or "Popular" badge
 * @avoid Several feature tiles on one canvas at once — use `bento-grid`
 * @tags feature, card, icon, badge, pricing, plan
 * @example
 * <Center>
 *   <FeatureCard title="Zero config" body="Install with shadcn, no path aliases." badge="New" />
 * </Center>
 */
import type React from "react";
import { effectStyle } from "./animate";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type FeatureCardProps = MotionProps & {
  /** Small mark shown in a rounded well above the title, e.g. an inline `<svg>`. */
  icon?: React.ReactNode;
  title: string;
  body?: string;
  /** Small pill in the top-right corner, e.g. "New" or "Popular". */
  badge?: string;
  /** Card width in design units. */
  width?: number;
  background?: string;
  borderColor?: string;
  titleColor?: string;
  bodyColor?: string;
  /** Icon well color, and the badge's default color. Defaults to the theme accent. */
  iconColor?: string;
  /** Icon well fill. Defaults to a soft tint of `iconColor`. */
  iconBackground?: string;
  badgeColor?: string;
  badgeBackground?: string;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function FeatureCard({
  icon,
  title,
  body,
  badge,
  width = 420,
  background,
  borderColor,
  titleColor,
  bodyColor,
  iconColor,
  iconBackground,
  badgeColor,
  badgeBackground,
  radius,
  style,
  className,
  ...motion
}: FeatureCardProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const accent = iconColor ?? theme.colors.accent;
  const { opacity: riseOpacity = 1, ...rise } = effectStyle("up", m.enter, u(46));

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: u(width),
        padding: u(32),
        borderRadius: u(radius ?? theme.radius),
        background: background ?? theme.colors.surface,
        border: `1px solid ${borderColor ?? theme.colors.border}`,
        fontFamily: theme.fonts.body,
        opacity: Number(riseOpacity) * (1 - m.exit),
        ...rise,
        ...style,
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: u(20),
            right: u(20),
            padding: `${u(4)}px ${u(12)}px`,
            borderRadius: 9999,
            background: badgeBackground ?? alpha(accent, 0.16),
            color: badgeColor ?? accent,
            fontSize: u(16),
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </div>
      )}
      {icon && (
        <div
          style={{
            width: u(56),
            height: u(56),
            borderRadius: u(theme.radius * 0.7),
            display: "grid",
            placeItems: "center",
            background: iconBackground ?? alpha(accent, 0.14),
            color: accent,
            fontSize: u(28),
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          marginTop: icon ? u(22) : 0,
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(34),
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          color: titleColor ?? theme.colors.foreground,
        }}
      >
        {title}
      </div>
      {body && (
        <div style={{ marginTop: u(10), fontSize: u(22), lineHeight: 1.4, color: bodyColor ?? theme.colors.muted }}>
          {body}
        </div>
      )}
    </div>
  );
}
