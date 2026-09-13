/**
 * @title Waveform
 * @category audio
 * @description The audio's shape, drawn as bars, a line or a mirrored band that moves with the sound.
 * @duration sustained
 * @use Audiograms and podcast clips
 * @use Any full-bleed band of motion tied to a voice or a track
 * @avoid A frequency view — use `spectrum`
 * @tags waveform, audiogram, podcast, audio
 * @example
 * <Waveform src={staticFile("episode.mp3")} variant="mirror" bars={64} />
 */
import { useWindowedAudioData, visualizeAudioWaveform } from "@remotion/media-utils";
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, useTheme, useViewport } from "./core";

export type WaveformProps = {
  /** Audio file; `staticFile("…")` or a URL. */
  src: string;
  variant?: "bars" | "line" | "mirror";
  /** Number of bars or points across the width. */
  bars?: number;
  /** Height of the band, in design units. */
  height?: number;
  color?: string;
  /** Seconds of audio loaded around the current frame. */
  windowInSeconds?: number;
  /** Rounded bar ends, in design units. */
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function Waveform({
  src,
  variant = "bars",
  bars = 48,
  height = 220,
  color,
  windowInSeconds = 10,
  radius = 6,
  style,
  className,
}: WaveformProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, width } = useViewport();
  const theme = useTheme();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({ src, frame, fps, windowInSeconds });

  const samples = audioData
    ? visualizeAudioWaveform({
        fps,
        frame,
        audioData,
        numberOfSamples: bars,
        windowInSeconds: 1 / fps,
        channel: 0,
        dataOffsetInSeconds,
      })
    : new Array(bars).fill(0);

  const tone = color ?? theme.colors.accent;
  const band = u(height);
  const gap = u(6);
  const barWidth = Math.max(u(2), (width - u(120) - gap * (bars - 1)) / bars);
  // Real mixes leave headroom well under full scale, so lift the raw amplitude
  // to make a quiet track still read as a moving waveform.
  const gain = 16;

  if (variant === "line") {
    const points = samples
      .map((value, index) => {
        const x = (index / (bars - 1)) * 100;
        const y = 50 - Math.min(1, value * gain) * 45;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <div className={className} style={{ width: "100%", height: band, ...style }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={points}
            fill="none"
            stroke={tone}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        height: band,
        ...style,
      }}
    >
      {samples.map((value, index) => {
        // `visualizeAudioWaveform`'s minus-one-to-one range alternates sign per index
        // as a drawing convention, not a real polarity — bar height needs magnitude.
        const size = Math.max(u(4), Math.min(1, Math.abs(value) * gain) * band);
        return (
          <div
            key={index}
            style={{
              width: barWidth,
              height: size,
              alignSelf: variant === "mirror" ? "center" : "flex-end",
              borderRadius: u(radius),
              background: tone,
              opacity: 0.55 + Math.min(1, value * 2) * 0.45,
              boxShadow: variant === "mirror" ? `0 0 ${u(12)}px ${alpha(tone, 0.35)}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
