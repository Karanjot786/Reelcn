/**
 * @title End Screen
 * @category social
 * @description Closing screen with a next-video slot, a subscribe slot and a countdown.
 * @duration 60
 * @use The last ten seconds of a long-form video
 * @use Handing viewers one clear next step
 * @tags end screen, outro, youtube, cta
 * @example
 * <Sequence from={900} durationInFrames={240}>
 *   <EndScreen title="Watch this next" nextTitle="How we cut render times in half" seconds={8} />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type EndScreenProps = MotionProps & {
  title?: string;
  nextTitle: string;
  /** Thumbnail for the next video; pass an `<Img>`. A placeholder frame is drawn when omitted. */
  thumbnail?: React.ReactNode;
  channel?: string;
  /** Countdown shown on the next-video card. */
  seconds?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function EndScreen({
  title = "Watch this next",
  nextTitle,
  thumbnail,
  channel,
  seconds = 8,
  style,
  className,
  ...motion
}: EndScreenProps) {
  const theme = useTheme();
  const { u, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const card = tween(m.frame, m.fps, { from: m.delay, duration: m.enterFrames, motion: m.preset });
  const side = tween(m.frame, m.fps, {
    from: m.delay + Math.round(m.fps * 0.2),
    duration: m.enterFrames,
    motion: m.preset,
  });
  const left = Math.max(0, seconds - Math.floor(m.frame / m.fps));

  return (
    <AbsoluteFill
      className={className}
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: u(28),
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        flexDirection: isPortrait ? "column" : "row",
        opacity: 1 - m.exit,
        ...style,
      }}
    >
      <div
        style={{
          width: isPortrait ? "100%" : u(620),
          borderRadius: u(theme.radius),
          overflow: "hidden",
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          opacity: Math.min(card, 1),
          translate: `0 ${(1 - Math.min(card, 1)) * u(26)}px`,
        }}
      >
        <div style={{ aspectRatio: "16 / 9", background: alpha(theme.colors.foreground, 0.08), position: "relative" }}>
          {thumbnail}
          <div
            style={{
              position: "absolute",
              right: u(12),
              bottom: u(12),
              padding: `${u(4)}px ${u(10)}px`,
              borderRadius: u(6),
              background: alpha(theme.colors.background, 0.8),
              color: theme.colors.foreground,
              fontSize: u(22),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {left}
          </div>
        </div>
        <div style={{ padding: u(20) }}>
          <div style={{ fontSize: u(22), color: theme.colors.accent, marginBottom: u(6) }}>{title}</div>
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontWeight: theme.headingWeight,
              fontSize: u(34),
              lineHeight: 1.15,
              color: theme.colors.foreground,
            }}
          >
            {nextTitle}
          </div>
          {channel ? (
            <div style={{ fontSize: u(22), color: theme.colors.muted, marginTop: u(8) }}>{channel}</div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: u(12),
          padding: u(24),
          borderRadius: u(theme.radius),
          background: alpha(theme.colors.surface, 0.8),
          border: `1px solid ${theme.colors.border}`,
          opacity: Math.min(side, 1),
          translate: `0 ${(1 - Math.min(side, 1)) * u(26)}px`,
        }}
      >
        <div style={{ width: u(88), height: u(88), borderRadius: "50%", background: theme.colors.accent }} />
        <div style={{ fontSize: u(26), fontWeight: 650, color: theme.colors.foreground }}>Subscribe</div>
        <div style={{ fontSize: u(20), color: theme.colors.muted }}>It is free</div>
      </div>
    </AbsoluteFill>
  );
}
