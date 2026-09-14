/**
 * @title Follow Card
 * @category social
 * @description A profile card whose follow button presses itself and flips to "Following", with the count ticking up.
 * @duration 50
 * @use Asking for a follow at the end of a short
 * @use Introducing a guest or a collaborator
 * @avoid A subscribe ask for long-form video — use `subscribe-cta`
 * @tags follow, profile, card, cta
 * @example
 * <Center>
 *   <FollowCard name="Ada Lovelace" handle="@ada" followers="24.8k" />
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type FollowCardProps = MotionProps & {
  name: string;
  handle?: string;
  /** Follower count, as text: "24.8k". */
  followers?: string;
  bio?: string;
  /** Avatar image; pass an `<Img>`. Initials are drawn when omitted. */
  avatar?: React.ReactNode;
  label?: string;
  followingLabel?: string;
  /** Frame, relative to this component, when the button presses itself. */
  pressAt?: number;
  width?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function FollowCard({
  name,
  handle,
  followers,
  bio,
  avatar,
  label = "Follow",
  followingLabel = "Following",
  pressAt,
  width = 620,
  style,
  className,
  ...motion
}: FollowCardProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const enter = Math.min(m.enter, 1);
  const press = m.delay + (pressAt ?? Math.round(m.fps * 1.1));
  const down = tween(m.frame, m.fps, { from: press, duration: Math.round(m.fps * 0.12), motion: "snappy" });
  const followed = m.frame >= press + Math.round(m.fps * 0.12);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: u(20),
        width: u(width),
        maxWidth: "100%",
        padding: u(26),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: `0 ${u(16)}px ${u(46)}px ${alpha("#000000", 0.2)}`,
        color: theme.colors.foreground,
        opacity: enter * (1 - m.exit),
        scale: String(0.96 + enter * 0.04),
        ...style,
      }}
    >
      <div
        style={{
          width: u(88),
          height: u(88),
          borderRadius: "50%",
          overflow: "hidden",
          background: theme.colors.accent,
          color: theme.colors.accentForeground,
          display: "grid",
          placeItems: "center",
          fontSize: u(34),
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {avatar ?? name.slice(0, 1)}
      </div>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ fontSize: u(30), fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: u(22), color: theme.colors.muted }}>
          {handle}
          {handle && followers ? " · " : ""}
          {followers ? `${followers} followers` : ""}
        </div>
        {bio ? <div style={{ fontSize: u(22), marginTop: u(8), color: theme.colors.muted }}>{bio}</div> : null}
      </div>
      <div
        style={{
          padding: `${u(12)}px ${u(24)}px`,
          borderRadius: u(theme.radius),
          background: followed ? "transparent" : theme.colors.accent,
          border: `1px solid ${followed ? theme.colors.border : "transparent"}`,
          color: followed ? theme.colors.foreground : theme.colors.accentForeground,
          fontSize: u(24),
          fontWeight: 650,
          whiteSpace: "nowrap",
          scale: String(1 - down * 0.06),
        }}
      >
        {followed ? followingLabel : label}
      </div>
    </div>
  );
}
