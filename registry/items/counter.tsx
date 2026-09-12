/**
 * @title Counter
 * @category text
 * @description Number that counts between two values with Intl formatting, or rolls its digits like an odometer.
 * @duration 45
 * @use Revenue, users, downloads and other headline metrics
 * @use Prices and percentages that should tick up on screen
 * @avoid A metric with a label and a change indicator — use `stat-counter`
 * @avoid Several metrics at once — use `kpi-grid`
 * @tags number, count up, odometer, metric, stat
 * @example
 * <Center>
 *   <Counter to={48200} format={{ style: "currency", currency: "USD" }} suffix="/mo" rolling />
 * </Center>
 */
import type React from "react";
import { useVideoConfig } from "remotion";
import { type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type CounterProps = MotionProps & {
  to: number;
  from?: number;
  /** Intl.NumberFormat options. Fraction digits default to however many `from` and `to` have. */
  format?: Intl.NumberFormatOptions;
  /** Defaults to "en-US", so renders match on every machine. */
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  /** Odometer-style digit wheels instead of a counting number. */
  rolling?: boolean;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

const decimals = (n: number) => {
  const text = String(n);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : Math.min(text.length - dot - 1, 6);
};

/** Show as many fraction digits as `from` and `to` have, unless the format already decides. */
function withDigits(format: Intl.NumberFormatOptions, from: number, to: number): Intl.NumberFormatOptions {
  if (
    format.minimumFractionDigits !== undefined ||
    format.maximumFractionDigits !== undefined ||
    format.minimumSignificantDigits !== undefined ||
    format.maximumSignificantDigits !== undefined
  ) {
    return format;
  }
  const digits = Math.max(0, Math.max(decimals(from), decimals(to)) - (format.style === "percent" ? 2 : 0));
  return { ...format, minimumFractionDigits: digits, maximumFractionDigits: digits };
}

const isDigit = (char: string) => char >= "0" && char <= "9";
const STRIP = "01234567890".split("");

/** One odometer wheel. `position` 0–10 runs through the digits and back to 0; fractions sit between two digits. */
function Wheel({ position }: { position: number }) {
  const offset = ((position % 10) + 10) % 10;
  return (
    <span style={{ height: "1.1em", overflow: "hidden" }}>
      <span style={{ display: "flex", flexDirection: "column", translate: `0 ${-offset * 1.1}em` }}>
        {STRIP.map((digit, index) => (
          <span key={index} style={{ height: "1.1em" }}>
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Lays the final value out once and turns each of its digits from the matching digit of the start value. */
function wheels(target: string, start: string, progress: number, up: boolean) {
  const startDigits = start.split("").filter(isDigit);
  const cells: React.ReactNode[] = [];
  let place = 0;
  for (let i = target.length - 1; i >= 0; i--) {
    const char = target[i];
    if (!isDigit(char)) {
      cells.unshift(<span key={i}>{char}</span>);
      continue;
    }
    const to = Number(char);
    const from = Number(startDigits[startDigits.length - 1 - place] || "0");
    // The lowest places spin extra full turns, so the number reads as rolling rather than blinking.
    const turns = 10 * Math.max(0, 2 - place);
    const travel = up ? ((to - from + 10) % 10) + turns : -(((from - to + 10) % 10) + turns);
    cells.unshift(<Wheel key={i} position={from + travel * progress} />);
    place++;
  }
  return cells;
}

export function Counter({
  to,
  from = 0,
  format = {},
  locale = "en-US",
  prefix = "",
  suffix = "",
  size = 120,
  weight,
  font = "heading",
  color,
  rolling = false,
  align = "center",
  style,
  className,
  ...motion
}: CounterProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const { fps } = useVideoConfig();
  const m = useMotion({ ...motion, duration: motion.duration ?? Math.round(fps * 1.5) });
  const fontPx = u(size);
  const formatter = new Intl.NumberFormat(locale, withDigits(format, from, to));
  const value = from + (to - from) * m.enter;

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 600),
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        letterSpacing: font === "mono" ? 0 : "-0.02em",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        textAlign: align,
        opacity: 1 - m.exit,
        translate: `0 ${-m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {rolling ? (
        <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
          {prefix}
          {wheels(formatter.format(to), formatter.format(from), m.enter, to >= from)}
          {suffix}
        </span>
      ) : (
        // The start and end values sit invisibly in the same grid cell, so the width never changes mid-count.
        <span
          style={{
            display: "inline-grid",
            justifyItems: align === "left" ? "start" : align === "right" ? "end" : "center",
          }}
        >
          {[from, to, value].map((n, index) => (
            <span key={index} style={{ gridArea: "1 / 1", visibility: index === 2 ? "visible" : "hidden" }}>
              {prefix}
              {formatter.format(n)}
              {suffix}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
