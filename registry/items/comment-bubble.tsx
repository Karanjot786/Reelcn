/**
 * @title Comment Bubble
 * @category social
 * @description A viewer comment card, optionally marked as a reply, with a like count that ticks up.
 * @duration 36
 * @use Answering a comment on camera
 * @use Showing the question a video is about to answer
 * @avoid A full post with author metrics — use `post-card`
 * @tags comment, reply, community, card
 * @example
 * <Center>
 *   <CommentBubble name="Katherine" handle="@kj" text="Which mic is that?" replyTo="Ada" likes={42} />
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type CommentBubbleProps = MotionProps & {
  name: string;
  text: string;
  handle?: string;
  /** Name this comment answers; shown as a small "Replying to" line. */
  replyTo?: string;
  likes?: number;
  /** Avatar image; pass an `<Img>`. Initials are drawn when omitted. */
  avatar?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function CommentBubble({
  name,
  text,
  handle,
  replyTo,
  likes,
  avatar,
  width = 700,
  style,
  className,
  ...motion
}: CommentBubbleProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const enter = Math.min(m.enter, 1);
  const count = tween(m.frame, m.fps, {
    from: m.delay + Math.round(m.fps * 0.4),
    duration: Math.round(m.fps * 0.9),
    motion: "gentle",
  });

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: u(16),
        width: u(width),
        maxWidth: "100%",
        color: theme.colors.foreground,
        opacity: enter * (1 - m.exit),
        translate: `${(1 - enter) * -u(18)}px 0`,
        ...style,
      }}
    >
      <div
        style={{
          width: u(56),
          height: u(56),
          borderRadius: "50%",
          overflow: "hidden",
          background: theme.colors.accent,
          color: theme.colors.accentForeground,
          display: "grid",
          placeItems: "center",
          fontSize: u(24),
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {avatar ?? name.slice(0, 1)}
      </div>
      <div
        style={{
          flexGrow: 1,
          padding: u(20),
          borderRadius: u(theme.radius),
          background: alpha(theme.colors.surface, 0.95),
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {replyTo ? (
          <div style={{ fontSize: u(18), color: theme.colors.accent, marginBottom: u(6) }}>Replying to {replyTo}</div>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: u(10) }}>
          <span style={{ fontSize: u(24), fontWeight: 700 }}>{name}</span>
          {handle ? <span style={{ fontSize: u(20), color: theme.colors.muted }}>{handle}</span> : null}
        </div>
        <div style={{ fontSize: u(26), lineHeight: 1.4, marginTop: u(8), textWrap: "pretty" }}>{text}</div>
        {likes === undefined ? null : (
          <div
            style={{ display: "flex", alignItems: "center", gap: u(8), marginTop: u(14), color: theme.colors.muted }}
          >
            <svg width={u(20)} height={u(20)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20Z"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: u(20), fontVariantNumeric: "tabular-nums" }}>
              {Math.round(likes * Math.min(count, 1))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
