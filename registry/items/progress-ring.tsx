/**
 * @title Progress Ring
 * @category data
 * @description Single percentage drawn as a round-capped ring that fills while the number in its center counts up.
 * @duration 45
 * @use Goal completion, adoption rate, uptime, a score out of 100
 * @use One number with a short label such as "of teams onboarded"
 * @avoid Splitting a whole into parts — use `donut`
 * @avoid Several numbers side by side — use `kpi-grid`
 * @tags progress, ring, gauge, percent, goal, data
 * @example
 * <Center>
 *   <ProgressRing value={72} label="Onboarding complete" />
 * </Center>
 */
import type React from "react";
import { decimals } from "./chart-scale";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type ProgressRingProps = MotionProps & {
  /** Percent, 0–100. */
  value: number;
  /** Caption under the number, inside the ring. */
  label?: string;
  /** Diameter in design units. Defaults by orientation. */
  size?: number;
  /** Ring thickness in design units. Defaults to 9% of the diameter. */
  thickness?: number;
  /** Frames the fill takes. Defaults to 1.2s. */
  drawFrames?: number;
  /** BCP 47 locale for the number. */
  locale?: string;
  /** `Intl.NumberFormat` options applied to the fraction (0–1). Defaults to a percent at the precision of `value`. */
  format?: Intl.NumberFormatOptions;
  /** Ring color. Defaults to the theme accent. */
  color?: string;
  /** Empty ring. Defaults to the theme border. */
  trackColor?: string;
  /** Center number. Defaults to the theme foreground. */
  textColor?: string;
  /** Caption. Defaults to the theme muted color. */
  labelColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function ProgressRing({
  value,
  label,
  size,
  thickness,
  drawFrames,
  locale = "en-US",
  format,
  color,
  trackColor,
  textColor,
  labelColor,
  style,
  className,
  ...motion
}: ProgressRingProps) {
  const theme = useTheme();
  const { u, isPortrait } = useViewport();
  const m = useMotion(motion);
  const d = u(size ?? (isPortrait ? 560 : 480));
  const ringW = thickness !== undefined ? u(thickness) : d * 0.09;
  const r = (d - ringW) / 2;
  const c = d / 2;
  const target = clamp01(value / 100);
  const draw = drawFrames ?? Math.round(m.fps * 1.2);
  const p = clamp01(tween(m.frame, m.fps, { from: m.delay, duration: draw, motion: m.preset }));
  const length = target * p;
  const places = decimals([value]);
  const numberFormat = new Intl.NumberFormat(
    locale,
    format ?? { style: "percent", minimumFractionDigits: places, maximumFractionDigits: places },
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: d,
        height: d,
        flexShrink: 0,
        fontFamily: theme.fonts.body,
        fontVariantNumeric: "tabular-nums",
        opacity: 1 - m.exit,
        scale: String(1 - m.exit * 0.06),
        ...style,
      }}
    >
      <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <title>{label ?? numberFormat.format(target)}</title>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={ringW}
          style={{ stroke: trackColor ?? theme.colors.border, opacity: clamp01(m.enter) }}
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={ringW}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${length} ${1 - length}`}
          transform={`rotate(-90 ${c} ${c})`}
          // A zero-length dash with round caps still paints a dot, so hide it until the ring starts moving.
          style={{ stroke: color ?? theme.colors.accent, opacity: length > 0.0005 ? 1 : 0 }}
        />
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
          padding: ringW * 2,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: d * 0.22,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            color: textColor ?? theme.colors.foreground,
          }}
        >
          {numberFormat.format(length)}
        </div>
        {label && (
          <div
            style={{
              marginTop: d * 0.035,
              fontSize: d * 0.062,
              lineHeight: 1.2,
              color: labelColor ?? theme.colors.muted,
              opacity: clamp01(m.enter),
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
