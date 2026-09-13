/**
 * @title Radial Visualizer
 * @category audio
 * @description Frequency bars arranged around a circle, for cover art and square posts.
 * @duration sustained
 * @use Square and vertical music posts built around cover art
 * @use A centred visual when a full-width band would not fit
 * @avoid Wide landscape banners — use `spectrum`
 * @tags radial, circular, music, visualizer, cover
 * @example
 * <RadialVisualizer src={staticFile("track.mp3")}>
 *   <Img src={staticFile("cover.jpg")} style={{ width: "100%", borderRadius: "50%" }} />
 * </RadialVisualizer>
 */
import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme, useViewport } from "./core";

export type RadialVisualizerProps = {
  /** Audio file; `staticFile("…")` or a URL. */
  src: string;
  /** Bars around the circle. */
  bars?: number;
  /** Diameter of the inner circle, in design units. */
  size?: number;
  /** Longest a bar can reach beyond the circle, in design units. */
  reach?: number;
  color?: string;
  /** Cover art or anything else to sit in the middle. */
  children?: React.ReactNode;
  windowInSeconds?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function RadialVisualizer({
  src,
  bars = 64,
  size = 420,
  reach = 120,
  color,
  children,
  windowInSeconds = 10,
  style,
  className,
}: RadialVisualizerProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useViewport();
  const theme = useTheme();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({ src, frame, fps, windowInSeconds });
  const samples = 2 ** Math.ceil(Math.log(bars) / Math.log(2));
  const values = audioData
    ? visualizeAudio({ fps, frame, audioData, numberOfSamples: samples, dataOffsetInSeconds }).slice(0, bars)
    : new Array(bars).fill(0);

  const diameter = u(size);
  const tone = color ?? theme.colors.accent;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: diameter,
        height: diameter,
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      {values.map((value, index) => {
        const angle = (index / bars) * 360;
        const length = Math.max(u(6), Math.min(1, value * (1 + index / bars) * 3) * u(reach));
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: u(6),
              height: length,
              borderRadius: u(3),
              background: tone,
              transformOrigin: "50% 0",
              transform: `rotate(${angle}deg) translate(-50%, ${diameter / 2}px)`,
              opacity: 0.5 + Math.min(1, value * 3) * 0.5,
            }}
          />
        );
      })}
      <div
        style={{
          width: diameter - u(24),
          height: diameter - u(24),
          borderRadius: "50%",
          overflow: "hidden",
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
