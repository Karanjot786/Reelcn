/**
 * @title Progress Bar
 * @category overlays
 * @description Video progress bar on the top or bottom edge, split into chapter segments, with the current chapter's name.
 * @duration data-driven
 * @use Tutorials, explainers and long-form edits with named chapters
 * @use Showing viewers how much of a short is left
 * @tags progress, chapters, timeline, playback, retention
 * @example
 * <Sequence durationInFrames={900}>
 *   <ProgressBar chapters={[{ at: 0, label: "Intro" }, { at: 240, label: "Setup" }, { at: 600, label: "Result" }]} />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type ProgressBarChapter = {
  /** First frame of the chapter, counted from the start of the bar's own Sequence. */
  at: number;
  label: string;
};

export type ProgressBarProps = MotionProps & {
  edge?: "top" | "bottom";
  /**
   * Frames the bar takes to fill. Defaults to the length of its parent `<Sequence>` (or the composition). Inside a
   * Sequence `useCurrentFrame()` is local, so the bar measures its own Sequence, not the whole video: put it at the
   * top level of the composition to track the full video.
   */
  total?: number;
  /** Chapter starts; each one becomes a segment of the bar. */
  chapters?: ProgressBarChapter[];
  /** Bar thickness in design units. */
  thickness?: number;
  /** Distance from the edge in design units. */
  offset?: number;
  /** Show the current chapter's name next to the bar. */
  showLabel?: boolean;
  /** Fill color. Defaults to the theme accent. */
  color?: string;
  /** Unfilled track. Defaults to the theme foreground at 20%. */
  trackColor?: string;
  /** Chapter label text. Defaults to the theme foreground. */
  labelColor?: string;
  /** Chapter label pill. Defaults to the theme surface at 85%. */
  labelBackground?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function ProgressBar({
  edge = "bottom",
  total,
  chapters = [],
  thickness = 8,
  offset = 0,
  showLabel = true,
  color,
  trackColor,
  labelColor,
  labelBackground,
  style,
  className,
  ...motion
}: ProgressBarProps) {
  const theme = useTheme();
  const { u, safe } = useViewport();
  const m = useMotion(motion);
  // Full on the last frame: frame `last` of a `last + 1` frame Sequence.
  const last = Math.max((total ?? m.durationInFrames) - 1, 1);
  const played = clamp01(m.frame / last);
  const sorted = chapters.slice().sort((a, b) => a.at - b.at);
  // Time before the first chapter still needs a segment; it just has no name.
  const starts = sorted.length === 0 || sorted[0].at > 0 ? [{ at: 0, label: "" }].concat(sorted) : sorted;
  const segments = starts.map((chapter, i) => ({
    start: clamp01(chapter.at / last),
    end: i + 1 < starts.length ? clamp01(starts[i + 1].at / last) : 1,
  }));
  const current = starts.reduce((found, chapter, i) => (m.frame >= chapter.at ? i : found), 0);
  const chapterNumber = sorted.indexOf(starts[current]) + 1;
  const shown = clamp01(m.enter);
  const labelIn = tween(m.frame, m.fps, {
    from: Math.max(starts[current].at, m.delay),
    duration: Math.round(m.enterFrames * 0.7),
    motion: m.preset,
  });
  const fill = color ?? theme.colors.accent;
  const track = trackColor ?? alpha(theme.colors.foreground, 0.2);
  const rounded = offset > 0 ? u(thickness / 2) : 0;
  const fromEdge = (distance: number) => (edge === "top" ? { top: u(distance) } : { bottom: u(distance) });

  return (
    <AbsoluteFill
      className={className}
      style={{ pointerEvents: "none", fontFamily: theme.fonts.body, opacity: 1 - m.exit, ...style }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          ...fromEdge(offset),
          height: u(thickness),
          display: "flex",
          gap: segments.length > 1 ? u(4) : 0,
          scale: `1 ${shown}`,
          transformOrigin: edge,
        }}
      >
        {segments.map((segment, i) => {
          const span = segment.end - segment.start;
          const filled = span > 0 ? clamp01((played - segment.start) / span) : 1;
          return (
            <div
              key={i}
              style={{
                flex: `${Math.max(span, 0)} 1 0`,
                position: "relative",
                overflow: "hidden",
                borderRadius: rounded,
                background: track,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${filled * 100}%`,
                  background: fill,
                }}
              />
            </div>
          );
        })}
      </div>
      {showLabel && chapterNumber > 0 && (
        <div
          style={{
            position: "absolute",
            left: safe.x,
            ...fromEdge(offset + thickness + 20),
            display: "flex",
            alignItems: "center",
            gap: u(12),
            padding: `${u(10)}px ${u(20)}px`,
            borderRadius: u(999),
            background: labelBackground ?? alpha(theme.colors.surface, 0.85),
            color: labelColor ?? theme.colors.foreground,
            fontSize: u(26),
            fontWeight: 600,
            opacity: clamp01(labelIn) * shown,
            translate: `0 ${(1 - labelIn) * u(10) * (edge === "top" ? -1 : 1)}px`,
          }}
        >
          <span style={{ opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
            {chapterNumber}/{sorted.length}
          </span>
          <span>{starts[current].label}</span>
        </div>
      )}
    </AbsoluteFill>
  );
}
