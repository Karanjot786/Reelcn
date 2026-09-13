/**
 * @title Audio Reactive
 * @category audio
 * @description Wraps anything and drives its scale, or a glow, from how loud the audio is right now.
 * @duration sustained
 * @use Making a logo, headline or card move with the track
 * @use Reacting to a voice whose tempo you do not know
 * @avoid A known BPM, where pure math is steadier — use `use-beat`
 * @tags audio, reactive, pulse, wrapper
 * @example
 * <AudioReactive src={staticFile("track.mp3")} effect="both">
 *   <Img src={staticFile("logo.png")} />
 * </AudioReactive>
 */
import { useWindowedAudioData, visualizeAudioWaveform } from "@remotion/media-utils";
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, useTheme, useViewport } from "./core";

export type AudioReactiveProps = {
  /** Audio file; `staticFile("…")` or a URL. */
  src: string;
  effect?: "scale" | "glow" | "both";
  /** How far the effect travels at full volume. 1 is a 20% swell. */
  intensity?: number;
  color?: string;
  windowInSeconds?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export function AudioReactive({
  src,
  effect = "scale",
  intensity = 1,
  color,
  windowInSeconds = 10,
  children,
  style,
  className,
}: AudioReactiveProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useViewport();
  const theme = useTheme();
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
  // `visualizeAudioWaveform`'s minus-one-to-one range alternates sign per index as a
  // drawing convention, not a real polarity, so summing magnitudes (not raw values)
  // keeps a silent clip from averaging out to a false zero. Real mixes leave headroom
  // well under full scale, so the mean gets a bigger gain than a peak reading would need.
  const level = Math.min(1, (samples.reduce((total, value) => total + Math.abs(value), 0) / samples.length) * 24);
  const tone = color ?? theme.colors.accent;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        scale: effect === "glow" ? "1" : String(1 + level * 0.2 * intensity),
        filter: effect === "scale" ? undefined : `drop-shadow(0 0 ${u(30) * level * intensity}px ${alpha(tone, 0.75)})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
