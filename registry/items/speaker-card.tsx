/**
 * @title Speaker Card
 * @category audio
 * @description A speaker's avatar and name, with a ring that swells while they talk.
 * @duration sustained
 * @use Podcast clips and audiograms with two or more voices
 * @use Showing who is speaking when there is no camera
 * @tags speaker, podcast, avatar, audiogram
 * @example
 * <SpeakerCard src={staticFile("episode.mp3")} name="Ada Lovelace" role="Founder" />
 */
import { useWindowedAudioData, visualizeAudioWaveform } from "@remotion/media-utils";
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type SpeakerCardProps = MotionProps & {
  /** Audio file; `staticFile("…")` or a URL. */
  src: string;
  name: string;
  role?: string;
  /** Avatar image; pass an `<Img>`. Initials are drawn when omitted. */
  avatar?: React.ReactNode;
  /** Avatar diameter, in design units. */
  size?: number;
  color?: string;
  windowInSeconds?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function SpeakerCard({
  src,
  name,
  role,
  avatar,
  size = 160,
  color,
  windowInSeconds = 10,
  style,
  className,
  ...motion
}: SpeakerCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useViewport();
  const theme = useTheme();
  const m = useMotion(motion);
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({ src, frame, fps, windowInSeconds });
  const samples = audioData
    ? visualizeAudioWaveform({
        fps,
        frame,
        audioData,
        numberOfSamples: 8,
        windowInSeconds: 1 / fps,
        channel: 0,
        dataOffsetInSeconds,
      })
    : [0];
  // Loudness right now: the mean of the window, clamped. `visualizeAudioWaveform`'s
  // minus-one-to-one range alternates sign per index as a drawing convention, not a
  // real polarity, so summing magnitudes (not raw values) keeps a silent clip from
  // averaging out to a false zero. Real mixes leave headroom well under full scale,
  // so the mean gets a bigger gain than a peak reading would need.
  const level = Math.min(1, (samples.reduce((total, value) => total + Math.abs(value), 0) / samples.length) * 24);
  const tone = color ?? theme.colors.accent;
  const diameter = u(size);
  const enter = Math.min(m.enter, 1);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: u(22),
        opacity: enter * (1 - m.exit),
        translate: `0 ${(1 - enter) * u(16)}px`,
        ...style,
      }}
    >
      <div style={{ position: "relative", width: diameter, height: diameter, display: "grid", placeItems: "center" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${u(5)}px solid ${tone}`,
            scale: String(1 + level * 0.16),
            opacity: 0.35 + level * 0.65,
          }}
        />
        <div
          style={{
            width: diameter - u(22),
            height: diameter - u(22),
            borderRadius: "50%",
            overflow: "hidden",
            background: alpha(tone, 0.22),
            color: theme.colors.foreground,
            display: "grid",
            placeItems: "center",
            fontSize: u(size * 0.3),
            fontWeight: 700,
          }}
        >
          {avatar ?? name.slice(0, 1)}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(38),
            color: theme.colors.foreground,
          }}
        >
          {name}
        </div>
        {role ? <div style={{ fontSize: u(26), color: theme.colors.muted, marginTop: u(4) }}>{role}</div> : null}
      </div>
    </div>
  );
}
