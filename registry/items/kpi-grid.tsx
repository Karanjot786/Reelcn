/**
 * @title KPI Grid
 * @category data
 * @description Two to six stat cards that pop in one after another, reflowing to up to four columns in landscape (never leaving a lone card on its own row), two in square, and one or two in portrait.
 * @duration 75
 * @use A dashboard summary slide: revenue, users, churn and NPS side by side
 * @use End-of-video recap of the numbers that mattered
 * @avoid A single metric — use `stat-counter`
 * @tags kpi, dashboard, metrics, grid, cards, data
 * @example
 * <Center>
 *   <KpiGrid
 *     items={[
 *       { label: "MRR", to: 48200, format: { style: "currency", currency: "USD", maximumFractionDigits: 0 }, delta: 12.4 },
 *       { label: "Active teams", to: 312, delta: 6.1 },
 *       { label: "Churn", to: 2.1, suffix: "%", delta: -0.4 },
 *       { label: "NPS", to: 61, delta: 4 },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";
import { StatCounter } from "./stat-counter";

export type KpiGridItem = {
  label: string;
  to: number;
  from?: number;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  /** Percentage change shown as an up/down badge. Omit to hide it for this card. */
  delta?: number;
  /** Small line under this card's number. */
  caption?: string;
  /** Overrides this card's number color. */
  color?: string;
};

export type KpiGridProps = MotionProps & {
  items: KpiGridItem[];
  /** BCP 47 locale applied to every card's numbers. */
  locale?: string;
  /** Card number font size in design units. Defaults by column count. */
  size?: number;
  /** Frames between cards popping in. Defaults to 0.15s. */
  stagger?: number;
  /** Width in design units. Defaults to the safe-area width. */
  width?: number;
  /** Delta badge color when positive. */
  positiveColor?: string;
  /** Delta badge color when negative. */
  negativeColor?: string;
  /** Card background. Defaults to the theme surface. */
  cardColor?: string;
  /** Card border. Defaults to the theme border. */
  borderColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function KpiGrid({
  items,
  locale = "en-US",
  size,
  stagger,
  width,
  positiveColor,
  negativeColor,
  cardColor,
  borderColor,
  style,
  className,
  ...motion
}: KpiGridProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, safe, orientation } = useViewport();
  const m = useMotion(motion);
  const count = Math.max(items.length, 1);
  const columns =
    orientation === "landscape"
      ? // A 3-column cap leaves a lone card stranded on its own row whenever there are exactly 4 items,
        // so let 4 items fill a single row and only fall back to 3 columns once there are more than that.
        count <= 4
        ? count
        : 3
      : orientation === "square"
        ? Math.min(2, count)
        : Math.min(count > 3 ? 2 : 1, count);
  const w = width !== undefined ? u(width) : canvasWidth - safe.x * 2;
  const gap = u(24);
  const cardSize = size ?? (columns === 1 ? 108 : columns === 2 ? 92 : columns === 3 ? 78 : 64);
  const step = stagger ?? Math.round(m.fps * 0.15);
  const delay = motion.delay ?? 0;

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        width: w,
        ...style,
      }}
    >
      {items.map((item, index) => {
        const cardDelay = delay + index * step;
        const pop = clamp01(tween(m.frame, m.fps, { from: cardDelay, duration: m.enterFrames, motion: m.preset }));
        return (
          <div
            key={index}
            style={{
              background: cardColor ?? theme.colors.surface,
              border: `1px solid ${borderColor ?? theme.colors.border}`,
              borderRadius: u(theme.radius),
              padding: `${u(32)}px ${u(24)}px`,
              opacity: pop,
              scale: String(0.9 + 0.1 * pop),
              translate: `0 ${(1 - pop) * u(18)}px`,
            }}
          >
            <StatCounter
              label={item.label}
              to={item.to}
              from={item.from}
              format={item.format}
              locale={locale}
              prefix={item.prefix}
              suffix={item.suffix}
              size={cardSize}
              color={item.color}
              delta={item.delta}
              caption={item.caption}
              positiveColor={positiveColor}
              negativeColor={negativeColor}
              delay={cardDelay}
              duration={motion.duration}
              exit={motion.exit}
              motion={motion.motion}
            />
          </div>
        );
      })}
    </div>
  );
}
