/**
 * @title Post Card
 * @category social
 * @description A platform-neutral social post: avatar, name, handle, text and engagement counts that tick up.
 * @duration 40
 * @use Turning a post into a video without copying any platform's interface
 * @use Showing praise or a quote in a shareable form
 * @avoid Attributed praise from a customer — use `quote-card`
 * @tags post, social, card, quote
 * @example
 * <Center>
 *   <PostCard name="Ada Lovelace" handle="@ada" time="2h" text="One timeline, three formats." metrics={{ likes: 1248, comments: 86, shares: 210 }} />
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type PostCardProps = MotionProps & {
  name: string;
  handle?: string;
  /** Relative time, as text: "2h", "Sep 12". */
  time?: string;
  text: string;
  /** Avatar image; pass an `<Img>`. Initials are drawn when omitted. */
  avatar?: React.ReactNode;
  metrics?: { likes?: number; comments?: number; shares?: number };
  verified?: boolean;
  width?: number;
  style?: React.CSSProperties;
  className?: string;
};

const icons = {
  likes: "M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20Z",
  comments: "M4 5h16v10H9l-5 4V5Z",
  shares: "M4 12v7h16v-7M12 3v12M8 7l4-4 4 4",
};

export function PostCard({
  name,
  handle,
  time,
  text,
  avatar,
  metrics,
  verified,
  width = 760,
  style,
  className,
  ...motion
}: PostCardProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const enter = Math.min(m.enter, 1);
  const count = tween(m.frame, m.fps, {
    from: m.delay + Math.round(m.fps * 0.3),
    duration: Math.round(m.fps * 1.2),
    motion: "gentle",
  });
  const format = (value: number) => Math.round(value * Math.min(count, 1)).toLocaleString();

  return (
    <div
      className={className}
      style={{
        width: u(width),
        maxWidth: "100%",
        padding: u(28),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: `0 ${u(18)}px ${u(50)}px ${alpha("#000000", 0.22)}`,
        color: theme.colors.foreground,
        opacity: enter * (1 - m.exit),
        translate: `0 ${(1 - enter) * u(22)}px`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: u(16) }}>
        <div
          style={{
            width: u(64),
            height: u(64),
            borderRadius: "50%",
            overflow: "hidden",
            background: theme.colors.accent,
            color: theme.colors.accentForeground,
            display: "grid",
            placeItems: "center",
            fontSize: u(26),
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {avatar ?? name.slice(0, 1)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: u(2), minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: u(8), fontSize: u(28), fontWeight: 700 }}>
            <span>{name}</span>
            {verified ? (
              <svg width={u(24)} height={u(24)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="m12 2 2.4 2.2 3.2-.4.6 3.2L21 8.6 19.4 11.5 21 14.4l-2.8 1.6-.6 3.2-3.2-.4L12 21l-2.4-2.2-3.2.4-.6-3.2L3 14.4l1.6-2.9L3 8.6l2.8-1.6.6-3.2 3.2.4L12 2Z"
                  fill="currentColor"
                  opacity={0.18}
                />
                <path
                  d="m8.5 12 2.4 2.4 4.6-4.8"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </div>
          <div style={{ fontSize: u(22), color: theme.colors.muted }}>
            {handle}
            {handle && time ? " · " : ""}
            {time}
          </div>
        </div>
      </div>
      <div style={{ fontSize: u(30), lineHeight: 1.4, marginTop: u(20), textWrap: "pretty" }}>{text}</div>
      {metrics ? (
        <div style={{ display: "flex", gap: u(32), marginTop: u(22), color: theme.colors.muted, fontSize: u(22) }}>
          {(["likes", "comments", "shares"] as const).map((key) =>
            metrics[key] === undefined ? null : (
              <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: u(8) }}>
                <svg width={u(22)} height={u(22)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d={icons[key]}
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{format(metrics[key] as number)}</span>
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
