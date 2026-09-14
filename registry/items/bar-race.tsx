/**
 * @title Bar Race
 * @category data
 * @description Ranked horizontal bars that grow and swap places smoothly as values change step by step, with a large step label.
 * @duration data-driven
 * @use Rankings over time: adoption by year, votes by round, leaderboard changes
 * @use Five to twelve series with a value at every step
 * @avoid A single snapshot — use `bar-chart`
 * @tags chart, bar race, ranking, leaderboard, data
 * @example
 * <Sequence durationInFrames={150}>
 *   <Center>
 *     <BarRace
 *       steps={["2021", "2022", "2023", "2024"]}
 *       series={[
 *         { label: "Atlas", values: [12, 30, 45, 61] },
 *         { label: "Nimbus", values: [25, 34, 40, 44] },
 *         { label: "Quill", values: [8, 20, 52, 70] },
 *       ]}
 *     />
 *   </Center>
 * </Sequence>
 */
import type React from "react";
import { formatter, palette } from "./chart-scale";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type BarRaceSeries = {
  label: string;
  /** One value per step. A short array holds its last value. */
  values: number[];
  /** Overrides this bar's color. */
  color?: string;
};

export type BarRaceProps = MotionProps & {
  series: BarRaceSeries[];
  /** One label per step, such as years. Defaults to 1, 2, 3… */
  steps?: string[];
  /**
   * Frames spent moving from one step to the next; the move eases, so the bars settle at every step.
   * The race lasts `enter + (steps - 1) × stepFrames`, so size the Sequence to fit.
   */
  stepFrames?: number;
  /** Bars shown at once. Lower ranks slide out of view. */
  limit?: number;
  /** Width in design units. Defaults to the safe-area width. */
  width?: number;
  /** Height in design units. Defaults by orientation. */
  height?: number;
  /** BCP 47 locale for numbers. */
  locale?: string;
  /** `Intl.NumberFormat` options for the value labels. Defaults to the precision of the data. */
  format?: Intl.NumberFormatOptions;
  /** Bar colors by series. Defaults to the theme palette, accent first. */
  colors?: string[];
  /** Series labels. Defaults to the theme foreground. */
  labelColor?: string;
  /** Value labels. Defaults to the theme muted color. */
  valueColor?: string;
  /** The large step label. Defaults to the theme muted color. */
  stepColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const longest = (texts: string[]) => texts.reduce((most, text) => Math.max(most, text.length), 0);

export function BarRace({
  series,
  steps,
  stepFrames,
  limit,
  width,
  height,
  locale = "en-US",
  format,
  colors,
  labelColor,
  valueColor,
  stepColor,
  style,
  className,
  ...motion
}: BarRaceProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const stepCount = series.reduce((most, s) => Math.max(most, s.values.length), 1);
  const move = stepFrames ?? m.fps;
  const start = m.delay + m.enterFrames;

  const valueAt = (s: BarRaceSeries, step: number) =>
    s.values.length === 0 ? 0 : s.values[Math.min(step, s.values.length - 1)];
  const ranksAt = (step: number) => {
    const order = series.map((_, index) => index);
    order.sort((a, b) => valueAt(series[b], step) - valueAt(series[a], step) || a - b);
    const ranks: number[] = [];
    order.forEach((seriesIndex, rank) => {
      ranks[seriesIndex] = rank;
    });
    return ranks;
  };

  const from = Math.min(Math.max(Math.floor((m.frame - start) / move), 0), Math.max(stepCount - 2, 0));
  const to = Math.min(from + 1, stepCount - 1);
  const f = stepCount < 2 ? 0 : tween(m.frame, m.fps, { from: start + from * move, duration: move, motion: "gentle" });
  const rankFrom = ranksAt(from);
  const rankTo = ranksAt(to);
  const current = series.map((s) => valueAt(s, from) + (valueAt(s, to) - valueAt(s, from)) * f);
  const rank = series.map((_, index) => rankFrom[index] + (rankTo[index] - rankFrom[index]) * f);
  const top = Math.max(...current, 0) || 1;

  const shown = Math.max(1, Math.min(limit ?? 8, series.length));
  const w = width !== undefined ? u(width) : canvasWidth - safe.x * 2;
  const h = height !== undefined ? u(height) : u(isPortrait ? 1000 : 640);
  const rowH = h / shown;
  const barH = rowH * 0.7;
  const labelPx = Math.min(Math.max(rowH * 0.34, u(20)), u(34));
  const all: number[] = [];
  for (const s of series) for (const value of s.values) all.push(value);
  const formatValue = formatter(all, locale, format);
  const labelW = Math.min(longest(series.map((s) => s.label)) * labelPx * 0.56 + u(24), w * 0.3);
  const valueW = longest(all.map(formatValue)) * labelPx * 0.62 + u(24);
  const plotW = Math.max(0, w - labelW - valueW);
  const seriesColors = palette(theme.colors.accent, theme.colors.highlight, theme.colors.foreground, series.length);
  const stepIndex = Math.min(stepCount - 1, Math.round(from + f));
  const stepLabel = steps?.[stepIndex] ?? String(stepIndex + 1);
  const radius = Math.min(u(theme.radius * 0.4), barH / 2);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: w,
        height: h,
        flexShrink: 0,
        overflow: "hidden",
        fontFamily: theme.fonts.body,
        fontVariantNumeric: "tabular-nums",
        color: theme.colors.foreground,
        opacity: 1 - m.exit,
        translate: `0 ${m.exit * u(24)}px`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: valueW,
          bottom: u(8),
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(isPortrait ? 110 : 140),
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: stepColor ?? theme.colors.muted,
          opacity: clamp01(m.enter) * 0.55,
        }}
      >
        {stepLabel}
      </div>
      {series.map((s, index) => {
        const grow = tween(m.frame, m.fps, {
          from: m.delay + rankFrom[index] * Math.round(m.fps * (2 / 30)),
          duration: m.enterFrames,
          motion: m.preset,
        });
        const y = rank[index] * rowH + (rowH - barH) / 2;
        const barW = (Math.max(0, current[index]) / top) * plotW * Math.max(grow, 0);
        const visible = clamp01(shown - rank[index]) * clamp01(grow * 2);
        if (visible <= 0) return null;
        return (
          <div key={index} style={{ position: "absolute", left: 0, top: y, width: w, height: barH, opacity: visible }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                width: labelW - u(18),
                top: "50%",
                translate: "0 -50%",
                fontSize: labelPx,
                lineHeight: 1,
                fontWeight: 500,
                textAlign: "right",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: labelColor ?? theme.colors.foreground,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                position: "absolute",
                left: labelW,
                top: 0,
                width: barW,
                height: barH,
                borderRadius: `0 ${radius}px ${radius}px 0`,
                background: s.color ?? colors?.[index] ?? seriesColors[index],
              }}
            />
            <div
              style={{
                position: "absolute",
                left: labelW + barW + u(14),
                top: "50%",
                translate: "0 -50%",
                fontSize: labelPx,
                lineHeight: 1,
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: valueColor ?? theme.colors.muted,
              }}
            >
              {formatValue(current[index] * clamp01(grow))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
