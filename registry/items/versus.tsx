/**
 * @title Versus
 * @category data
 * @description Two-column comparison: numbers become mirrored bars, booleans become check/cross marks, strings stay text, and the side with more wins is highlighted in the accent.
 * @duration 70
 * @use Plan or tier comparisons, before/after specs, us-vs-them feature tables
 * @use Three to eight rows mixing numbers, yes/no features and short text
 * @avoid A single trend over time — use `line-chart`
 * @tags compare, comparison, table, plans, pricing, data
 * @example
 * <Center>
 *   <Versus
 *     left="Starter"
 *     right="Pro"
 *     rows={[
 *       { label: "Price / mo", left: 19, right: 49 },
 *       { label: "Seats included", left: 5, right: 25 },
 *       { label: "Priority support", left: false, right: true },
 *       { label: "Response time", left: "48h", right: "2h" },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { formatter } from "./chart-scale";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type VersusRow = {
  label: string;
  left: number | boolean | string;
  right: number | boolean | string;
};

export type VersusProps = MotionProps & {
  /** Left column title. */
  left: string;
  /** Right column title. */
  right: string;
  rows: VersusRow[];
  /** BCP 47 locale for numeric rows. */
  locale?: string;
  /** `Intl.NumberFormat` options for numeric rows. Defaults to the precision of the data. */
  format?: Intl.NumberFormatOptions;
  /** Width in design units. Defaults to the safe-area width. */
  width?: number;
  /** Frames between rows. Defaults to 0.12s. */
  stagger?: number;
  /** Winning title and winning bars / marks. Defaults to the theme accent. */
  accentColor?: string;
  /** The other title and row text. Defaults to the theme foreground. */
  color?: string;
  /** Row labels. Defaults to the theme muted color. */
  labelColor?: string;
  /** Losing bars / marks. Defaults to the theme muted color. */
  loseColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** -1 the left value wins the row, 1 the right value wins, 0 no contest (mixed types, strings, or a tie). */
function rowWinner(row: VersusRow): -1 | 0 | 1 {
  if (typeof row.left === "number" && typeof row.right === "number") {
    if (row.left === row.right) return 0;
    return row.left > row.right ? -1 : 1;
  }
  if (typeof row.left === "boolean" && typeof row.right === "boolean") {
    if (row.left === row.right) return 0;
    return row.left ? -1 : 1;
  }
  return 0;
}

export function Versus({
  left,
  right,
  rows,
  locale = "en-US",
  format,
  width,
  stagger,
  accentColor,
  color,
  labelColor,
  loseColor,
  style,
  className,
  ...motion
}: VersusProps) {
  const theme = useTheme();
  const { u, width: canvasWidth, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const w = width !== undefined ? u(width) : canvasWidth - safe.x * 2;
  const rowH = u(isPortrait ? 130 : 112);
  const step = stagger ?? Math.round(m.fps * 0.12);
  const lead = Math.round(m.enterFrames * 0.4);
  const titleP = clamp01(tween(m.frame, m.fps, { from: m.delay, duration: m.enterFrames, motion: m.preset }));

  const numbers: number[] = [];
  rows.forEach((row) => {
    if (typeof row.left === "number") numbers.push(row.left);
    if (typeof row.right === "number") numbers.push(row.right);
  });
  const formatValue = formatter(numbers.length > 0 ? numbers : [0], locale, format);

  let score = 0;
  rows.forEach((row) => {
    score += rowWinner(row);
  });
  const winner: "left" | "right" | null = score < 0 ? "left" : score > 0 ? "right" : null;

  const accent = accentColor ?? theme.colors.accent;
  const base = color ?? theme.colors.foreground;
  const lose = loseColor ?? alpha(theme.colors.muted, 0.45);
  // `mono` sets accent === foreground, so hue can't show a winner there; fall back to weight + a dimmer loser.
  const flatAccent = accent.toLowerCase() === base.toLowerCase();
  const baseText = flatAccent ? alpha(base, 0.65) : base;
  const winBoost = flatAccent ? 200 : 0;
  const barH = Math.min(rowH * 0.3, u(30));
  const barMaxW = w / 2 - u(70);
  const radius = Math.min(u(theme.radius * 0.5), barH / 2);

  function cell(value: number | boolean | string, win: boolean, side: "left" | "right", growth: number, max: number) {
    if (typeof value === "number") {
      const len = (Math.abs(value) / max) * barMaxW * growth;
      const bar = (
        <div
          style={{
            width: len,
            height: barH,
            flexShrink: 0,
            background: win ? accent : lose,
            borderRadius: side === "left" ? `${radius}px 0 0 ${radius}px` : `0 ${radius}px ${radius}px 0`,
          }}
        />
      );
      const text = (
        <span
          style={{
            fontSize: u(24),
            lineHeight: 1,
            fontWeight: win ? 600 + winBoost : 600,
            whiteSpace: "nowrap",
            color: win ? accent : baseText,
          }}
        >
          {formatValue(value)}
        </span>
      );
      return side === "left" ? (
        <>
          {text}
          {bar}
        </>
      ) : (
        <>
          {bar}
          {text}
        </>
      );
    }
    if (typeof value === "boolean") {
      return value ? (
        <svg width={u(34)} height={u(34)} viewBox="0 0 20 20">
          <title>yes</title>
          <path
            d="M4 11 L8 15 L16 5"
            fill="none"
            stroke={accent}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width={u(30)} height={u(30)} viewBox="0 0 20 20">
          <title>no</title>
          <path d="M4 4 L16 16 M16 4 L4 16" stroke={lose} strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <span
        style={{
          fontSize: u(24),
          lineHeight: 1.2,
          fontWeight: win ? 600 + winBoost : 600,
          color: win ? accent : baseText,
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: w,
        fontFamily: theme.fonts.body,
        fontVariantNumeric: "tabular-nums",
        opacity: 1 - m.exit,
        translate: `0 ${m.exit * u(24)}px`,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: u(28),
          opacity: titleP,
          translate: `0 ${(1 - titleP) * u(12)}px`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: winner === "left" ? theme.headingWeight + winBoost : theme.headingWeight,
            fontSize: u(isPortrait ? 50 : 58),
            letterSpacing: "-0.02em",
            color: winner === "left" ? accent : baseText,
          }}
        >
          {left}
        </div>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: u(26), fontWeight: 700, color: theme.colors.muted }}>
          VS
        </div>
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: winner === "right" ? theme.headingWeight + winBoost : theme.headingWeight,
            fontSize: u(isPortrait ? 50 : 58),
            letterSpacing: "-0.02em",
            textAlign: "right",
            color: winner === "right" ? accent : baseText,
          }}
        >
          {right}
        </div>
      </div>
      <div style={{ position: "relative" }}>
        {rows.map((row, index) => {
          const p = clamp01(
            tween(m.frame, m.fps, { from: m.delay + lead + index * step, duration: m.enterFrames, motion: m.preset }),
          );
          const win = rowWinner(row);
          const leftMax = typeof row.left === "number" ? Math.abs(row.left) : 0;
          const rightMax = typeof row.right === "number" ? Math.abs(row.right) : 0;
          const rowMax = Math.max(leftMax, rightMax, 1e-9);
          return (
            <div
              key={index}
              style={{ position: "relative", height: rowH, opacity: p, translate: `0 ${(1 - p) * u(14)}px` }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  textAlign: "center",
                  fontSize: u(24),
                  fontWeight: 600,
                  color: labelColor ?? theme.colors.muted,
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: rowH * 0.32,
                  bottom: 0,
                  width: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: typeof row.left === "number" ? "flex-end" : "center",
                  gap: u(10),
                  paddingRight: u(20),
                }}
              >
                {cell(row.left, win === -1, "left", p, rowMax)}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: rowH * 0.32,
                  bottom: 0,
                  width: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: typeof row.right === "number" ? "flex-start" : "center",
                  gap: u(10),
                  paddingLeft: u(20),
                }}
              >
                {cell(row.right, win === 1, "right", p, rowMax)}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: rowH * 0.28,
                  bottom: u(6),
                  width: 1,
                  background: theme.colors.border,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
