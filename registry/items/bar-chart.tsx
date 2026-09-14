/**
 * @title Bar Chart
 * @category data
 * @description Bars that grow in one by one over nice gridlines with counting value labels; vertical in landscape and square, horizontal in portrait.
 * @duration 40
 * @use Comparing a handful of categories: revenue by quarter, survey answers, signups by channel
 * @use Calling out one bar in the accent while the rest stay muted
 * @avoid Rankings that change over time — use `bar-race`
 * @avoid Trends across many points — use `line-chart`
 * @tags chart, bar, column, compare, data
 * @example
 * <Center>
 *   <BarChart
 *     data={[
 *       { label: "Q1", value: 42 },
 *       { label: "Q2", value: 58 },
 *       { label: "Q3", value: 51 },
 *       { label: "Q4", value: 87 },
 *     ]}
 *     highlight={3}
 *     format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
 *   />
 * </Center>
 */
import type React from "react";
import { formatter, niceTicks, scaleLinear } from "./chart-scale";
import { alpha, type MotionProps, tween, useMotion, useTextMetrics, useTheme, useViewport } from "./core";

export type BarChartDatum = {
  label: string;
  value: number;
  /** Overrides this bar's color. */
  color?: string;
};

export type BarChartProps = MotionProps & {
  data: BarChartDatum[];
  /** `auto` draws vertical bars in landscape and square, horizontal bars in portrait. */
  orientation?: "auto" | "vertical" | "horizontal";
  /** Index of the bar painted in the accent; the others turn muted. Without it every bar uses the accent. */
  highlight?: number;
  /** Width in design units. Defaults to the safe-area width. */
  width?: number;
  /** Height in design units. Defaults by orientation and bar count. */
  height?: number;
  /** Frames between bars. Defaults to 0.1s. */
  stagger?: number;
  /** BCP 47 locale for numbers. */
  locale?: string;
  /** `Intl.NumberFormat` options for value and axis labels. Defaults to the precision of the data. */
  format?: Intl.NumberFormatOptions;
  showValues?: boolean;
  showGrid?: boolean;
  /** Bar color. Defaults to the theme accent. */
  color?: string;
  /** Bars other than `highlight`. Defaults to the theme muted color at 45%. */
  mutedColor?: string;
  /** Category and axis labels. Defaults to the theme muted color. */
  labelColor?: string;
  /** Value labels. Defaults to the theme foreground. */
  valueColor?: string;
  /** Gridlines. Defaults to the theme border. */
  gridColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const longest = (texts: string[]) => texts.reduce((most, text) => Math.max(most, text.length), 0);

export function BarChart({
  data,
  orientation = "auto",
  highlight,
  width,
  height,
  stagger,
  locale = "en-US",
  format,
  showValues = true,
  showGrid = true,
  color,
  mutedColor,
  labelColor,
  valueColor,
  gridColor,
  style,
  className,
  ...motion
}: BarChartProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const horizontal = orientation === "horizontal" || (orientation === "auto" && isPortrait);
  const count = Math.max(data.length, 1);
  const w = width !== undefined ? u(width) : canvasWidth - safe.x * 2;
  const h = height !== undefined ? u(height) : horizontal ? u(Math.min(1100, 120 + count * 110)) : u(620);

  const values = data.map((d) => d.value);
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values), horizontal ? 4 : 5);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const formatValue = formatter(values, locale, format);
  const formatTick = formatter(ticks, locale, format);
  const hasNegative = values.some((value) => value < 0);

  const tickPx = u(22);
  const labelPx = u(horizontal ? 28 : 26);
  const longestLabel = data.reduce((most, d) => (d.label.length > most.length ? d.label : most), "");
  const labelMetrics = useTextMetrics(longestLabel, { fontFamily: theme.fonts.body, fontSize: labelPx });
  const valuePx = u(horizontal ? 28 : 30);
  const step = stagger ?? Math.round(m.fps * 0.1);
  const lead = Math.round(m.enterFrames * 0.35);
  const reveal = clamp01(m.enter);
  const accent = color ?? theme.colors.accent;
  const muted = mutedColor ?? alpha(theme.colors.muted, 0.45);
  const labelC = labelColor ?? theme.colors.muted;
  const valueC = valueColor ?? theme.colors.foreground;
  const gridC = gridColor ?? theme.colors.border;
  const baseline = alpha(theme.colors.foreground, 0.35);

  const grow = (index: number) =>
    tween(m.frame, m.fps, { from: m.delay + lead + index * step, duration: m.enterFrames, motion: m.preset });
  const isMuted = (index: number) => highlight !== undefined && highlight !== index;
  const text = (size: number, fill: string): React.CSSProperties => ({
    position: "absolute",
    fontSize: size,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: fill,
  });

  const children: React.ReactNode[] = [];

  if (!horizontal) {
    const axisW = showGrid ? longest(ticks.map(formatTick)) * tickPx * 0.62 + u(18) : 0;
    const top = showValues ? valuePx * 1.7 : u(8);
    const under = hasNegative && showValues ? valuePx * 1.6 : 0;
    const y1 = h - labelPx * 2.2 - under;
    const y = scaleLinear([lo, hi], [y1, top]);
    const band = (w - axisW) / count;
    const barW = Math.min(band * 0.64, u(180));
    const radius = Math.min(u(theme.radius * 0.4), barW / 2);

    ticks.forEach((tick) => {
      if (!showGrid && tick !== 0) return;
      children.push(
        <div
          key={`grid-${tick}`}
          style={{
            position: "absolute",
            left: axisW,
            width: w - axisW,
            top: y(tick),
            height: 1,
            background: tick === 0 ? baseline : gridC,
            opacity: reveal,
          }}
        />,
      );
      if (showGrid) {
        children.push(
          <div
            key={`tick-${tick}`}
            style={{
              ...text(tickPx, labelC),
              left: 0,
              width: axisW - u(14),
              top: y(tick),
              translate: "0 -50%",
              textAlign: "right",
              opacity: reveal,
            }}
          >
            {formatTick(tick)}
          </div>,
        );
      }
    });

    data.forEach((d, index) => {
      const p = grow(index);
      const current = d.value * p;
      const zero = y(0);
      const end = y(current);
      const barTop = Math.min(zero, end);
      const barLeft = axisW + band * index + (band - barW) / 2;
      children.push(
        <div
          key={`bar-${index}`}
          style={{
            position: "absolute",
            left: barLeft,
            width: barW,
            top: barTop,
            height: Math.abs(end - zero),
            background: d.color ?? (isMuted(index) ? muted : accent),
            borderRadius: d.value < 0 ? `0 0 ${radius}px ${radius}px` : `${radius}px ${radius}px 0 0`,
          }}
        />,
      );
      if (showValues) {
        children.push(
          <div
            key={`value-${index}`}
            style={{
              ...text(valuePx, isMuted(index) ? labelC : valueC),
              left: axisW + band * index,
              width: band,
              top: d.value < 0 ? barTop + Math.abs(end - zero) + valuePx * 0.35 : barTop - valuePx * 1.35,
              textAlign: "center",
              fontWeight: 600,
              opacity: clamp01(p * 1.5),
            }}
          >
            {formatValue(d.value * clamp01(p))}
          </div>,
        );
      }
      children.push(
        <div
          key={`label-${index}`}
          style={{
            ...text(labelPx, labelC),
            left: axisW + band * index,
            width: band,
            top: y1 + under + labelPx * 0.7,
            padding: `0 ${u(6)}px`,
            boxSizing: "border-box",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: reveal,
          }}
        >
          {d.label}
        </div>,
      );
    });
  } else {
    const labelW = Math.min(
      (labelMetrics.ready ? labelMetrics.width : longest(data.map((d) => d.label)) * labelPx * 0.56) + u(44),
      w * 0.36,
    );
    const valueW = showValues ? longest(values.map(formatValue)) * valuePx * 0.6 + u(20) : u(8);
    const x0 = labelW + (hasNegative ? valueW : 0);
    const x1 = w - valueW;
    const y1 = h - (showGrid ? tickPx * 2 : 0);
    const x = scaleLinear([lo, hi], [x0, x1]);
    const band = y1 / count;
    const barH = Math.min(band * 0.62, u(96));
    const radius = Math.min(u(theme.radius * 0.4), barH / 2);

    ticks.forEach((tick) => {
      if (!showGrid && tick !== 0) return;
      children.push(
        <div
          key={`grid-${tick}`}
          style={{
            position: "absolute",
            left: x(tick),
            width: 1,
            top: 0,
            height: y1,
            background: tick === 0 ? baseline : gridC,
            opacity: reveal,
          }}
        />,
      );
      if (showGrid) {
        children.push(
          <div
            key={`tick-${tick}`}
            style={{
              ...text(tickPx, labelC),
              left: x(tick),
              top: y1 + tickPx * 0.6,
              translate: "-50% 0",
              opacity: reveal,
            }}
          >
            {formatTick(tick)}
          </div>,
        );
      }
    });

    data.forEach((d, index) => {
      const p = grow(index);
      const zero = x(0);
      const end = x(d.value * p);
      const center = band * index + band / 2;
      children.push(
        <div
          key={`bar-${index}`}
          style={{
            position: "absolute",
            left: Math.min(zero, end),
            width: Math.abs(end - zero),
            top: center - barH / 2,
            height: barH,
            background: d.color ?? (isMuted(index) ? muted : accent),
            borderRadius: d.value < 0 ? `${radius}px 0 0 ${radius}px` : `0 ${radius}px ${radius}px 0`,
          }}
        />,
      );
      if (showValues) {
        children.push(
          <div
            key={`value-${index}`}
            style={{
              ...text(valuePx, isMuted(index) ? labelC : valueC),
              left: d.value < 0 ? end - u(14) : end + u(14),
              top: center,
              translate: d.value < 0 ? "-100% -50%" : "0 -50%",
              fontWeight: 600,
              opacity: clamp01(p * 1.5),
            }}
          >
            {formatValue(d.value * clamp01(p))}
          </div>,
        );
      }
      children.push(
        <div
          key={`label-${index}`}
          style={{
            ...text(labelPx, labelC),
            left: 0,
            width: labelW - u(20),
            top: center,
            translate: "0 -50%",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: reveal,
          }}
        >
          {d.label}
        </div>,
      );
    });
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: w,
        height: h,
        flexShrink: 0,
        fontFamily: theme.fonts.body,
        fontVariantNumeric: "tabular-nums",
        color: theme.colors.foreground,
        opacity: 1 - m.exit,
        translate: `0 ${m.exit * u(24)}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
