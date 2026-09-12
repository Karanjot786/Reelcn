/**
 * @title Timeline
 * @category data
 * @description Milestones on a single axis whose line draws on while dots pop and labels rise in sequence; horizontal in landscape and square, vertical in portrait.
 * @duration 90
 * @use A roadmap, launch history or step-by-step process with three to seven beats
 * @use Company milestones or a project's key dates
 * @avoid Ranked values changing over time — use `bar-race`
 * @tags timeline, roadmap, milestones, history, process, data
 * @example
 * <Center>
 *   <Timeline
 *     milestones={[
 *       { label: "Founded", date: "2019", body: "Two co-founders, one laptop" },
 *       { label: "Seed round", date: "2021", body: "$3.2M raised" },
 *       { label: "Series A", date: "2023", body: "40 people, 12 countries" },
 *       { label: "1M events/day", date: "2025" },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type TimelineMilestone = {
  label: string;
  date?: string;
  body?: string;
};

export type TimelineProps = MotionProps & {
  milestones: TimelineMilestone[];
  /** Length of the axis in design units (width in landscape/square, height in portrait). Defaults to the safe-area size. */
  size?: number;
  /** Frames the line takes to draw across every milestone. Defaults to 1.2s. */
  drawFrames?: number;
  /** Extra frames a dot's pop lags behind the line reaching it. */
  popDelay?: number;
  lineColor?: string;
  dotColor?: string;
  labelColor?: string;
  dateColor?: string;
  bodyColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Timeline({
  milestones,
  size,
  drawFrames,
  popDelay,
  lineColor,
  dotColor,
  labelColor,
  dateColor,
  bodyColor,
  style,
  className,
  ...motion
}: TimelineProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, height: canvasHeight, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const count = Math.max(milestones.length, 1);

  const w = isPortrait ? u(460) : size !== undefined ? u(size) : canvasWidth - safe.x * 2;
  const h = isPortrait ? (size !== undefined ? u(size) : canvasHeight - safe.top - safe.bottom) : u(230);
  const axisLen = isPortrait ? h : w;

  const draw = drawFrames ?? Math.round(m.fps * 1.2);
  const lag = popDelay ?? Math.round(m.fps * 0.08);
  const progress = clamp01(tween(m.frame, m.fps, { from: m.delay, duration: draw, motion: m.preset }));
  const fraction = (index: number) => (count === 1 ? 0.5 : index / (count - 1));

  const line = lineColor ?? theme.colors.border;
  const dot = dotColor ?? theme.colors.accent;
  const labelC = labelColor ?? theme.colors.foreground;
  const dateC = dateColor ?? theme.colors.muted;
  const bodyC = bodyColor ?? theme.colors.muted;

  const dotSize = u(isPortrait ? 26 : 24);
  const gutter = u(isPortrait ? 40 : 46);
  const dotCross = dotSize / 2;
  const labelCross = dotCross + gutter;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: w,
        height: h,
        flexShrink: 0,
        fontFamily: theme.fonts.body,
        opacity: 1 - m.exit,
        translate: isPortrait ? `${m.exit * u(24)}px 0` : `0 ${m.exit * u(24)}px`,
        ...style,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <title>{milestones.map((milestone) => milestone.label).join(", ")}</title>
        <line
          x1={isPortrait ? dotCross : 0}
          y1={isPortrait ? 0 : dotCross}
          x2={isPortrait ? dotCross : axisLen}
          y2={isPortrait ? axisLen : dotCross}
          strokeWidth={u(3)}
          style={{ stroke: line, opacity: clamp01(m.enter) }}
        />
        <line
          x1={isPortrait ? dotCross : 0}
          y1={isPortrait ? 0 : dotCross}
          x2={isPortrait ? dotCross : axisLen}
          y2={isPortrait ? axisLen : dotCross}
          strokeWidth={u(3)}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${progress} ${1 - progress}`}
          style={{ stroke: dot, opacity: progress > 0 ? 1 : 0 }}
        />
      </svg>
      {milestones.map((milestone, index) => {
        const f = fraction(index);
        const along = f * axisLen;
        const pop = clamp01(
          tween(m.frame, m.fps, {
            from: m.delay + f * draw + lag,
            duration: Math.round(m.fps * 0.35),
            motion: "bouncy",
          }),
        );
        const rise = clamp01(
          tween(m.frame, m.fps, {
            from: m.delay + f * draw + lag + Math.round(m.fps * 0.06),
            duration: m.enterFrames,
            motion: m.preset,
          }),
        );
        return (
          <div key={index}>
            <div
              style={{
                position: "absolute",
                left: isPortrait ? dotCross : along,
                top: isPortrait ? along : dotCross,
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                background: dot,
                translate: "-50% -50%",
                scale: String(pop),
              }}
            />
            {/* The first/last dot sits flush with the axis ends, so a centered label there would run past the
                frame edge — anchor those two to the dot instead of straddling it. */}
            <div
              style={{
                position: "absolute",
                left: isPortrait ? labelCross : along,
                top: isPortrait ? along : labelCross,
                width: isPortrait ? u(340) : u(260),
                textAlign: isPortrait
                  ? "left"
                  : index === 0
                    ? "left"
                    : index === milestones.length - 1
                      ? "right"
                      : "center",
                opacity: rise,
                translate: isPortrait
                  ? `${(1 - rise) * u(16)}px -50%`
                  : `${index === 0 ? "0%" : index === milestones.length - 1 ? "-100%" : "-50%"} ${(1 - rise) * u(16)}px`,
              }}
            >
              <div style={{ fontSize: u(30), lineHeight: 1.15, fontWeight: 700, color: labelC }}>{milestone.label}</div>
              {milestone.date && (
                <div style={{ fontSize: u(22), marginTop: u(4), fontVariantNumeric: "tabular-nums", color: dateC }}>
                  {milestone.date}
                </div>
              )}
              {milestone.body && (
                <div style={{ fontSize: u(22), lineHeight: 1.3, marginTop: u(8), color: bodyC }}>{milestone.body}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
