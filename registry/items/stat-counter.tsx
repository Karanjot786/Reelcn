/**
 * @title Stat Counter
 * @category data
 * @description Single metric: a label above a big counting number, an optional up/down delta badge beside it, and a caption underneath.
 * @duration 60
 * @use A headline KPI on its own slide: revenue, active users, churn
 * @use A metric that should show change since last period
 * @avoid Several metrics together — use `kpi-grid`
 * @avoid A bare number with no label — use `counter`
 * @tags stat, kpi, metric, delta, counter, data
 * @example
 * <Center>
 *   <StatCounter
 *     label="Monthly recurring revenue"
 *     to={48200}
 *     format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
 *     delta={12.4}
 *     caption="vs. last month"
 *   />
 * </Center>
 */
import type React from "react";
import { decimals } from "./chart-scale";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";
import { Counter } from "./counter";

export type StatCounterProps = MotionProps & {
  label: string;
  to: number;
  from?: number;
  /** Intl.NumberFormat options. Fraction digits default to however many `from` and `to` have. */
  format?: Intl.NumberFormatOptions;
  /** Defaults to "en-US", so renders match on every machine. */
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Font size of the number in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  /** Odometer-style digit wheels instead of a counting number. */
  rolling?: boolean;
  align?: "left" | "center" | "right";
  /** Percentage change, e.g. `12.4` for "+12.4%" or `-3` for "-3%". Omit to hide the badge. */
  delta?: number;
  /** Badge color when `delta` is zero or positive. */
  positiveColor?: string;
  /** Badge color when `delta` is negative. */
  negativeColor?: string;
  /** Small line under the number, such as "vs. last month". */
  caption?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function StatCounter({
  label,
  to,
  from = 0,
  format,
  locale = "en-US",
  prefix = "",
  suffix = "",
  size = 108,
  weight,
  font = "heading",
  color,
  rolling = false,
  align = "center",
  delta,
  positiveColor = "#34d399",
  negativeColor = "#f87171",
  caption,
  style,
  className,
  ...motion
}: StatCounterProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const step = Math.round(m.fps * 0.12);
  const labelP = clamp01(tween(m.frame, m.fps, { from: m.delay, duration: m.enterFrames, motion: m.preset }));
  const deltaP = clamp01(
    tween(m.frame, m.fps, { from: m.delay + step * 4, duration: m.enterFrames, motion: m.preset }),
  );
  const up = (delta ?? 0) >= 0;
  const deltaColor = up ? positiveColor : negativeColor;
  const places = decimals([delta ?? 0]);
  const deltaFormat = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
  const items = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: items,
        gap: u(8),
        fontFamily: theme.fonts.body,
        textAlign: align,
        opacity: 1 - m.exit,
        translate: `0 ${m.exit * u(20)}px`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: u(26),
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: theme.colors.muted,
          opacity: labelP,
          translate: `0 ${(1 - labelP) * u(10)}px`,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: u(16) }}>
        <Counter
          to={to}
          from={from}
          format={format}
          locale={locale}
          prefix={prefix}
          suffix={suffix}
          size={size}
          weight={weight}
          font={font}
          color={color}
          rolling={rolling}
          align={align}
          {...motion}
          exit={false}
        />
        {delta !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: u(4),
              padding: `${u(4)}px ${u(12)}px`,
              borderRadius: u(theme.radius * 0.6),
              background: alpha(deltaColor, 0.16),
              opacity: deltaP,
              translate: `0 ${(1 - deltaP) * u(10)}px`,
            }}
          >
            <svg width={u(16)} height={u(16)} viewBox="0 0 10 10">
              <title>{up ? "up" : "down"}</title>
              <polygon points={up ? "5,1 9,8 1,8" : "5,9 1,2 9,2"} fill={deltaColor} />
            </svg>
            <span style={{ fontSize: u(24), lineHeight: 1, fontWeight: 700, color: deltaColor }}>
              {deltaFormat.format(Math.abs(delta) / 100)}
            </span>
          </div>
        )}
      </div>
      {caption && (
        <div style={{ fontSize: u(22), lineHeight: 1.2, color: theme.colors.muted, opacity: labelP }}>{caption}</div>
      )}
    </div>
  );
}
