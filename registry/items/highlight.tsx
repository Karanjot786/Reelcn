/**
 * @title Highlight
 * @category text
 * @description Sentence with one phrase emphasized by a marker sweep, a hand-drawn underline or circle, or an outlined box.
 * @duration 30
 * @use Calling out the key phrase in a quote, claim or hook
 * @use Tutorial titles that point at a single term
 * @avoid Cycling through several words in one slot — use `word-rotator`
 * @tags marker, underline, circle, box, emphasis, annotate
 * @example
 * <Center>
 *   <Highlight text="Render videos with plain React" highlight="plain React" variant="marker" />
 * </Center>
 */
import type React from "react";
import { type MotionProps, StrokeOverlay, tween, useMotion, useTheme, useViewport } from "./core";

export type HighlightVariant = "marker" | "underline" | "box" | "circle";

export type HighlightProps = MotionProps & {
  text: string;
  /** Phrase inside `text` to emphasize (first match, case-sensitive). It never wraps, so keep it short. */
  highlight: string;
  variant?: HighlightVariant;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  /** Sentence color. Defaults to the theme foreground. */
  color?: string;
  /** Marker, line and box color. Defaults to the theme highlight. */
  highlightColor?: string;
  /** Phrase color on top of the marker. Defaults to the theme foreground or background, whichever reads better. */
  highlightTextColor?: string;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

/** Hand-drawn strokes, stretched over the phrase. Underline box is 100×20, circle box 100×40. */
const UNDERLINE = "M2 13 C 24 7, 58 6, 98 9";
const CIRCLE = "M78 5 C 55 0, 16 2, 5 14 C -3 26, 20 38, 52 37 C 84 36, 100 27, 96 15 C 92 5, 64 1, 36 6";

/** WCAG relative luminance of a #rgb or #rrggbb color; null for any other CSS color. */
function luminance(color: string): number | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, "$&$&") : match[1];
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** Whichever of `a` and `b` contrasts more with `background`; `a` when a color can't be parsed. */
function readableOn(background: string, a: string, b: string) {
  const base = luminance(background);
  const la = luminance(a);
  const lb = luminance(b);
  if (base === null || la === null || lb === null) return a;
  const contrast = (l: number) => (Math.max(l, base) + 0.05) / (Math.min(l, base) + 0.05);
  return contrast(la) >= contrast(lb) ? a : b;
}

export function Highlight({
  text,
  highlight,
  variant = "marker",
  size = 88,
  weight,
  font = "heading",
  color,
  highlightColor,
  highlightTextColor,
  align = "center",
  style,
  className,
  ...motion
}: HighlightProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const mark = highlightColor ?? theme.colors.highlight;
  const at = highlight ? text.indexOf(highlight) : -1;
  // The mark starts drawing once the sentence has mostly arrived.
  const drawn = Math.min(
    Math.max(
      tween(m.frame, m.fps, {
        from: m.delay + Math.round(m.enterFrames * 0.6),
        duration: m.enterFrames,
        motion: m.preset,
      }),
      0,
    ),
    1,
  );
  const stroke = {
    fill: "none",
    stroke: mark,
    strokeWidth: fontPx * (variant === "box" ? 0.045 : 0.06),
    strokeLinecap: "round" as const,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - drawn,
  };
  const overlay: React.CSSProperties = { position: "absolute", overflow: "visible", pointerEvents: "none" };

  const markFor = (phrase: string) => {
    switch (variant) {
      case "marker":
        // A copy of the phrase in a contrasting color rides on the band, so dark text never sits on a dark canvas.
        return (
          <span
            style={{
              ...overlay,
              top: 0,
              bottom: 0,
              left: "-0.08em",
              right: "-0.08em",
              padding: "0 0.08em",
              clipPath: `inset(0 ${(1 - drawn) * 100}% 0 0)`,
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: "0.14em 0 0.04em",
                background: mark,
                borderRadius: Math.min(u(theme.radius), fontPx * 0.12),
              }}
            />
            <span
              style={{
                position: "relative",
                color: highlightTextColor ?? readableOn(mark, theme.colors.foreground, theme.colors.background),
              }}
            >
              {phrase}
            </span>
          </span>
        );
      case "underline":
        return (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            style={{ ...overlay, left: "-0.06em", top: "0.9em", width: "calc(100% + 0.12em)", height: "0.32em" }}
          >
            <StrokeOverlay
              d={UNDERLINE}
              kind={theme.stroke}
              seed="highlight-underline"
              color={mark}
              strokeWidth={fontPx * 0.06}
              drawn={drawn}
              extraProps={{ vectorEffect: "non-scaling-stroke", strokeLinecap: "round" }}
            />
          </svg>
        );
      case "circle":
        return (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ ...overlay, left: "-0.3em", top: "-0.12em", width: "calc(100% + 0.6em)", height: "1.45em" }}
          >
            <StrokeOverlay
              d={CIRCLE}
              kind={theme.stroke}
              seed="highlight-circle"
              color={mark}
              strokeWidth={fontPx * 0.06}
              drawn={drawn}
              extraProps={{ vectorEffect: "non-scaling-stroke", strokeLinecap: "round" }}
            />
          </svg>
        );
      case "box":
        return (
          <svg
            aria-hidden="true"
            style={{ ...overlay, left: "-0.16em", top: "0.04em", width: "calc(100% + 0.32em)", height: "1.1em" }}
          >
            <rect width="100%" height="100%" rx={Math.min(u(theme.radius), fontPx * 0.2)} {...stroke} />
          </svg>
        );
    }
  };

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
        color: color ?? theme.colors.foreground,
        lineHeight: 1.15,
        letterSpacing: font === "mono" ? 0 : "-0.025em",
        textAlign: align,
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: m.presence,
        translate: `0 ${(1 - Math.min(m.enter, 1)) * fontPx * 0.25 - m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {at < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
            {variant === "marker" ? null : markFor(highlight)}
            <span style={{ position: "relative" }}>{highlight}</span>
            {variant === "marker" ? markFor(highlight) : null}
          </span>
          {text.slice(at + highlight.length)}
        </>
      )}
    </div>
  );
}
