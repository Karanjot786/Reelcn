/**
 * @title Line Chart
 * @category data
 * @description One or more series drawn on over nice gridlines, with a dot and a counting value label riding the tip of each line.
 * @duration 60
 * @use Trends over time: monthly signups, latency, revenue run-rate
 * @use Comparing two to four series on one axis
 * @avoid Comparing separate categories — use `bar-chart`
 * @avoid Volume or cumulative totals — use `area-chart`
 * @tags chart, line, trend, time series, data
 * @example
 * <Center>
 *   <LineChart
 *     labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
 *     series={[
 *       { label: "Organic", points: [120, 180, 170, 260, 310, 420] },
 *       { label: "Paid", points: [90, 110, 150, 140, 190, 230] },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { useId } from "react";
import { formatter, niceTicks, palette, scaleLinear } from "./chart-scale";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type LineChartSeries = {
  label: string;
  points: number[];
  /** Overrides this series' color. */
  color?: string;
};

export type LineChartProps = MotionProps & {
  series: LineChartSeries[];
  /** X-axis labels, one per point. Crowded axes show every second label or fewer. */
  labels?: string[];
  /** Fill under each line with a gradient that fades to transparent. `area-chart` sets this. */
  area?: boolean;
  /** Opacity at the top of the area gradient. */
  areaOpacity?: number;
  /** Start the y axis at zero. Defaults to `true` with `area`; otherwise the axis fits the data. */
  zero?: boolean;
  /** Width in design units. Defaults to the safe-area width. */
  width?: number;
  /** Height in design units, legend included. */
  height?: number;
  /** Line thickness in design units. */
  strokeWidth?: number;
  /** Frames each line takes to draw. Defaults to 1.4s. */
  drawFrames?: number;
  /** Frames between series. Defaults to 0.25s. */
  stagger?: number;
  showGrid?: boolean;
  /** Dot and counting value label at the tip of each line. */
  showEnd?: boolean;
  /** BCP 47 locale for numbers. */
  locale?: string;
  /** `Intl.NumberFormat` options for value and axis labels. Defaults to the precision of the data. */
  format?: Intl.NumberFormatOptions;
  /** Series colors in order. Defaults to the theme palette, accent first. */
  colors?: string[];
  /** Axis and legend labels. Defaults to the theme muted color. */
  labelColor?: string;
  /** Gridlines. Defaults to the theme border. */
  gridColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

type Point = { x: number; y: number; v: number };

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const longest = (texts: string[]) => texts.reduce((most, text) => Math.max(most, text.length), 0);

/** The point `progress` (0–1) of the way along a polyline, measured by length, with its value interpolated. */
function tip(points: Point[], progress: number): Point {
  if (points.length < 2) return points[0];
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    lengths.push(length);
    total += length;
  }
  let remaining = clamp01(progress) * total;
  for (let i = 1; i < points.length; i++) {
    const length = lengths[i - 1];
    if (remaining <= length || i === points.length - 1) {
      const f = length === 0 ? 1 : clamp01(remaining / length);
      const a = points[i - 1];
      const b = points[i];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, v: a.v + (b.v - a.v) * f };
    }
    remaining -= length;
  }
  return points[points.length - 1];
}

export function LineChart({
  series,
  labels,
  area = false,
  areaOpacity = 0.35,
  zero,
  width,
  height,
  strokeWidth = 5,
  drawFrames,
  stagger,
  showGrid = true,
  showEnd = true,
  locale = "en-US",
  format,
  colors,
  labelColor,
  gridColor,
  style,
  className,
  ...motion
}: LineChartProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, safe, isPortrait, orientation } = useViewport();
  const m = useMotion(motion);
  // useId can contain characters that break url(#id) references in older React versions.
  const uid = `lc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const w = width !== undefined ? u(width) : canvasWidth - safe.x * 2;
  const h = height !== undefined ? u(height) : u(isPortrait ? 820 : 640);
  const count = series.reduce((most, s) => Math.max(most, s.points.length), 1);
  const all: number[] = [];
  for (const s of series) for (const point of s.points) all.push(point);
  const fromZero = zero ?? area;
  const ticks = niceTicks(
    fromZero ? Math.min(0, ...all) : Math.min(...all),
    fromZero ? Math.max(0, ...all) : Math.max(...all),
    5,
  );
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const formatValue = formatter(all, locale, format);
  const formatTick = formatter(ticks, locale, format);
  const seriesColors = palette(theme.colors.accent, theme.colors.highlight, theme.colors.foreground, series.length);
  const colorOf = (index: number) => series[index].color ?? colors?.[index] ?? seriesColors[index];

  const tickPx = u(22);
  const labelPx = u(24);
  const valuePx = u(28);
  const legendPx = u(26);
  const lineW = u(strokeWidth);
  const draw = drawFrames ?? Math.round(m.fps * 1.4);
  const step = stagger ?? Math.round(m.fps * 0.25);
  const reveal = clamp01(m.enter);
  const labelC = labelColor ?? theme.colors.muted;
  const gridC = gridColor ?? theme.colors.border;

  const legendH = series.length > 1 ? legendPx * 2.4 : 0;
  const chartH = h - legendH;
  const axisW = showGrid ? longest(ticks.map(formatTick)) * tickPx * 0.62 + u(18) : u(8);
  const endW = showEnd ? longest(all.map(formatValue)) * valuePx * 0.62 + u(44) : lineW;
  const x0 = axisW;
  const x1 = w - endW;
  const y0 = Math.max(tickPx, valuePx) * 0.6;
  const y1 = chartH - (labels ? labelPx * 2.2 : tickPx * 0.6);
  const x = (index: number) => (count === 1 ? (x0 + x1) / 2 : x0 + (index / (count - 1)) * (x1 - x0));
  const y = scaleLinear([lo, hi], [y1, y0]);
  const base = y(Math.min(Math.max(0, lo), hi));

  const maxLabels = isPortrait ? 4 : orientation === "square" ? 6 : 10;
  const every = Math.max(1, Math.ceil(count / maxLabels));

  const lines = series.map((s, index) => {
    const points = s.points.map((v, i) => ({ x: x(i), y: y(v), v }));
    const progress = tween(m.frame, m.fps, { from: m.delay + index * step, duration: draw, motion: m.preset });
    const p = clamp01(progress);
    const d = points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    return { points, p, d, head: points.length > 0 ? tip(points, p) : { x: x0, y: base, v: 0 } };
  });

  // Keep tip labels from overlapping: sort by height and push each one below the previous.
  const labelY = lines.map((line) => line.head.y);
  const order = lines.map((_, index) => index).sort((a, b) => labelY[a] - labelY[b]);
  for (let k = 1; k < order.length; k++) {
    labelY[order[k]] = Math.max(labelY[order[k]], labelY[order[k - 1]] + valuePx * 1.25);
  }

  const text = (size: number, fill: string): React.CSSProperties => ({
    position: "absolute",
    fontSize: size,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: fill,
  });

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
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
      {series.length > 1 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: `${u(12)}px ${u(40)}px`, height: legendH, paddingLeft: x0 }}
        >
          {series.map((s, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: u(14),
                fontSize: legendPx,
                lineHeight: 1,
                color: labelC,
                opacity: clamp01(
                  tween(m.frame, m.fps, { from: m.delay + index * step, duration: m.enterFrames, motion: m.preset }),
                ),
              }}
            >
              <div style={{ width: u(30), height: lineW, borderRadius: lineW, background: colorOf(index) }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "relative", width: w, height: chartH }}>
        <svg
          width={w}
          height={chartH}
          viewBox={`0 0 ${w} ${chartH}`}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <title>{series.map((s) => s.label).join(", ")}</title>
          {area && (
            <defs>
              {lines.map((line, index) => (
                <linearGradient key={`fill-${index}`} id={`${uid}-fill-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: colorOf(index), stopOpacity: areaOpacity }} />
                  <stop offset="1" style={{ stopColor: colorOf(index), stopOpacity: 0 }} />
                </linearGradient>
              ))}
              {lines.map((line, index) => (
                <clipPath key={`clip-${index}`} id={`${uid}-clip-${index}`}>
                  <rect x={0} y={0} width={Math.max(0, line.head.x)} height={chartH} />
                </clipPath>
              ))}
            </defs>
          )}
          {ticks.map((tick) =>
            showGrid || tick === lo ? (
              <line
                key={`grid-${tick}`}
                x1={x0}
                x2={x1 + lineW}
                y1={y(tick)}
                y2={y(tick)}
                strokeWidth={1}
                style={{ stroke: tick === 0 ? alpha(theme.colors.foreground, 0.35) : gridC, opacity: reveal }}
              />
            ) : null,
          )}
          {area &&
            lines.map((line, index) =>
              line.points.length > 1 ? (
                <path
                  key={`area-${index}`}
                  d={`${line.d} L${line.points[line.points.length - 1].x.toFixed(2)},${base.toFixed(2)} L${line.points[0].x.toFixed(2)},${base.toFixed(2)} Z`}
                  clipPath={`url(#${uid}-clip-${index})`}
                  style={{ fill: `url(#${uid}-fill-${index})` }}
                />
              ) : null,
            )}
          {lines.map((line, index) => (
            <path
              key={`line-${index}`}
              d={line.d}
              pathLength={1}
              strokeDasharray="1 2"
              strokeDashoffset={1 - line.p}
              strokeWidth={lineW}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ stroke: colorOf(index), opacity: line.p > 0 ? 1 : 0 }}
            />
          ))}
          {showEnd &&
            lines.map((line, index) => (
              <g key={`tip-${index}`} style={{ opacity: clamp01(line.p * 6) }}>
                <circle cx={line.head.x} cy={line.head.y} r={lineW * 3} style={{ fill: alpha(colorOf(index), 0.22) }} />
                <circle cx={line.head.x} cy={line.head.y} r={lineW * 1.6} style={{ fill: colorOf(index) }} />
              </g>
            ))}
        </svg>
        {showGrid &&
          ticks.map((tick) => (
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
            </div>
          ))}
        {labels?.map((label, index) =>
          index % every === 0 && index < count ? (
            <div
              key={`label-${index}`}
              style={{
                ...text(labelPx, labelC),
                left: x(index),
                top: y1 + labelPx * 0.8,
                translate: "-50% 0",
                opacity: reveal,
              }}
            >
              {label}
            </div>
          ) : null,
        )}
        {showEnd &&
          lines.map((line, index) => (
            <div
              key={`value-${index}`}
              style={{
                ...text(valuePx, colorOf(index)),
                left: line.head.x + lineW * 3 + u(10),
                top: labelY[index],
                translate: "0 -50%",
                fontWeight: 600,
                opacity: clamp01(line.p * 6),
              }}
            >
              {formatValue(line.head.v)}
            </div>
          ))}
      </div>
    </div>
  );
}
