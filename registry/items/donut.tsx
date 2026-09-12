/**
 * @title Donut
 * @category data
 * @description Ring chart whose segments sweep in one after another around a counting total, with a legend beside it (below in portrait and square).
 * @duration 50
 * @use Share of a whole: traffic sources, budget split, time spent across a few groups
 * @use Two to six segments
 * @avoid A single percentage — use `progress-ring`
 * @avoid Many small categories — use `bar-chart`
 * @tags chart, donut, pie, share, percent, data
 * @example
 * <Center>
 *   <Donut
 *     label="Visits"
 *     data={[
 *       { label: "Search", value: 4200 },
 *       { label: "Direct", value: 2600 },
 *       { label: "Social", value: 1500 },
 *       { label: "Email", value: 700 },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { formatter, palette } from "./chart-scale";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type DonutDatum = {
  label: string;
  value: number;
  /** Overrides this segment's color. */
  color?: string;
};

export type DonutProps = MotionProps & {
  data: DonutDatum[];
  /** Caption under the center number. */
  label?: string;
  /** Center number. Defaults to the sum of `data`. */
  total?: number;
  /** Diameter in design units. Defaults by orientation. */
  size?: number;
  /** Ring thickness as a fraction of the radius. */
  thickness?: number;
  /** Gap between segments in design units. */
  gap?: number;
  /** Frames the full sweep takes. Defaults to 1.2s. */
  drawFrames?: number;
  /** What each legend row shows after its label. */
  legendValue?: "percent" | "value" | "none";
  showLegend?: boolean;
  /** BCP 47 locale for numbers. */
  locale?: string;
  /** `Intl.NumberFormat` options for the center total and legend values. */
  format?: Intl.NumberFormatOptions;
  /** Segment colors in order. Defaults to the theme palette, accent first. */
  colors?: string[];
  /** Empty ring behind the segments. Defaults to the theme border. */
  trackColor?: string;
  /** Center number and legend labels. Defaults to the theme foreground. */
  color?: string;
  /** Caption and legend values. Defaults to the theme muted color. */
  labelColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Donut({
  data,
  label,
  total,
  size,
  thickness = 0.26,
  gap = 6,
  drawFrames,
  legendValue = "percent",
  showLegend = true,
  locale = "en-US",
  format,
  colors,
  trackColor,
  color,
  labelColor,
  style,
  className,
  ...motion
}: DonutProps) {
  const theme = useTheme();
  const { u, isLandscape, isPortrait } = useViewport();
  const m = useMotion(motion);
  const d = u(size ?? (isLandscape ? 560 : isPortrait ? 600 : 460));
  const ringW = (d / 2) * thickness;
  const r = (d - ringW) / 2;
  const c = d / 2;

  const values = data.map((item) => Math.max(0, item.value));
  const sum = values.reduce((a, b) => a + b, 0);
  const center = total ?? sum;
  const draw = drawFrames ?? Math.round(m.fps * 1.2);
  const sweep = clamp01(tween(m.frame, m.fps, { from: m.delay, duration: draw, motion: m.preset }));
  const gapUnits = data.length > 1 ? u(gap) / (2 * Math.PI * r) : 0;
  const seriesColors = palette(theme.colors.accent, theme.colors.highlight, theme.colors.foreground, data.length);
  const colorOf = (index: number) => data[index].color ?? colors?.[index] ?? seriesColors[index];
  const formatValue = formatter(values.concat([center]), locale, format);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const fg = color ?? theme.colors.foreground;
  const labelC = labelColor ?? theme.colors.muted;

  const segments: { start: number; fraction: number }[] = [];
  let start = 0;
  for (const value of values) {
    const fraction = sum > 0 ? value / sum : 0;
    segments.push({ start, fraction });
    start += fraction;
  }

  // Shrink the center number until its final text fits inside the hole.
  const hole = d - ringW * 2;
  const centerText = formatValue(center);
  const centerPx = Math.min(d * 0.16, (hole * 0.8) / (Math.max(centerText.length, 1) * 0.6));
  const legendPx = u(isLandscape ? 30 : 32);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: isLandscape ? "row" : "column",
        alignItems: "center",
        gap: u(isLandscape ? 88 : 56),
        fontFamily: theme.fonts.body,
        fontVariantNumeric: "tabular-nums",
        color: fg,
        opacity: 1 - m.exit,
        translate: `0 ${m.exit * u(24)}px`,
        ...style,
      }}
    >
      <div style={{ position: "relative", width: d, height: d, flexShrink: 0 }}>
        <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <title>{data.map((item) => item.label).join(", ")}</title>
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            strokeWidth={ringW}
            style={{ stroke: trackColor ?? theme.colors.border, opacity: clamp01(m.enter) }}
          />
          {segments.map((segment, index) => {
            const shown = Math.min(Math.max(sweep - segment.start, 0), segment.fraction);
            const length = Math.max(0, shown - gapUnits);
            return (
              <circle
                key={index}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                strokeWidth={ringW}
                pathLength={1}
                strokeDasharray={`${length} ${1 - length}`}
                strokeDashoffset={-(segment.start + gapUnits / 2)}
                transform={`rotate(-90 ${c} ${c})`}
                style={{ stroke: colorOf(index), opacity: length > 0 ? 1 : 0 }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontWeight: theme.headingWeight,
              fontSize: centerPx,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {formatValue(center * sweep)}
          </div>
          {label && (
            <div style={{ marginTop: d * 0.03, fontSize: d * 0.055, color: labelC, maxWidth: hole * 0.8 }}>{label}</div>
          )}
        </div>
      </div>
      {showLegend && (
        <div style={{ display: "flex", flexDirection: "column", gap: u(22), width: u(isLandscape ? 460 : 620) }}>
          {data.map((item, index) => {
            const p = tween(m.frame, m.fps, {
              from: m.delay + segments[index].start * draw,
              duration: m.enterFrames,
              motion: m.preset,
            });
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: u(18),
                  fontSize: legendPx,
                  lineHeight: 1.1,
                  opacity: clamp01(p),
                  translate: `${(1 - p) * u(24)}px 0`,
                }}
              >
                <div
                  style={{
                    width: u(18),
                    height: u(18),
                    borderRadius: "50%",
                    background: colorOf(index),
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </div>
                {legendValue !== "none" && (
                  <div style={{ color: labelC }}>
                    {legendValue === "percent" ? percent.format(segments[index].fraction) : formatValue(item.value)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
