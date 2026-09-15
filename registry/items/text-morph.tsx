/**
 * @title Text Morph
 * @category text
 * @description Morphs one phrase into another: shared letters fly to their new position, leftover letters blur in or out instead of a plain cross-fade.
 * @duration 36
 * @use Before/after headlines, "problem → solution" hooks
 * @use A single word swap that should feel connected, not like two separate reveals
 * @tags morph, kinetic, headline, grapheme
 * @example
 * <Center>
 *   <TextMorph from="Build faster" to="Ship faster" />
 * </Center>
 */

import type React from "react";
import { Fragment } from "react";
import {
  clamp01,
  graphemes,
  type MotionProps,
  matchGraphemes,
  measurePx,
  tween,
  useMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type TextMorphProps = MotionProps & {
  from: string;
  to: string;
  holdFrames?: number;
  size?: number;
  color?: string;
  accentColor?: string;
  /** Faint trailing copies of matched letters as they move. Off by default. */
  trail?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

function graphemeXPositions(chars: string[], font: string): number[] {
  let x = 0;
  const positions: number[] = [];
  for (const char of chars) {
    positions.push(x);
    x += measurePx(char, font);
  }
  return positions;
}

export function TextMorph({
  from,
  to,
  holdFrames = 18,
  size = 96,
  color,
  accentColor,
  trail = false,
  style,
  className,
  ...motion
}: TextMorphProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const fontString = `${theme.headingWeight} ${fontPx}px ${theme.fonts.heading}`;
  const gate = useTextMetrics(`${from}${to}`, {
    fontFamily: theme.fonts.heading,
    fontSize: fontPx,
    fontWeight: theme.headingWeight,
  });
  const fromChars = graphemes(from);
  const toChars = graphemes(to);
  const fromX = gate.ready ? graphemeXPositions(fromChars, fontString) : fromChars.map(() => 0);
  const toX = gate.ready ? graphemeXPositions(toChars, fontString) : toChars.map(() => 0);
  const pairs = matchGraphemes(fromChars, toChars);
  // `progress` keeps the theme's own motion shape (including settle/bouncy overshoot) for the letter
  // position lerp below, where an overshoot-then-settle read is the intended personality. `t` is a plain
  // linear time fraction across the full `enterFrames` window, independent of motion shape — the blur-in/
  // blur-out timing below needs a value that only reaches 1 at the end of the window, not at 40% of it
  // (which is what settle's own overshoot curve does, and is what produced the "morph finishes in 2-3
  // frames under daylight" bug: settle crosses these formulas' own 0.5/0.7 thresholds within the first
  // fifth of the window).
  const progress = tween(m.frame, m.fps, { from: m.delay, duration: m.enterFrames, motion: m.preset });
  const t = clamp01((m.frame - m.delay) / Math.max(m.enterFrames, 1));
  const trailCopies = trail ? [1, 2, 3] : [];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        height: fontPx * 1.2,
        fontFamily: theme.fonts.heading,
        fontSize: fontPx,
        fontWeight: theme.headingWeight,
        color: color ?? theme.colors.foreground,
        opacity: gate.ready ? 1 - m.exit : 0,
        ...style,
      }}
    >
      {pairs.map((pair, key) => {
        if (pair.fromIndex >= 0 && pair.toIndex >= 0) {
          const fromPos = fromX[pair.fromIndex];
          const toPos = toX[pair.toIndex];
          const x = fromPos + (toPos - fromPos) * progress;
          return (
            <Fragment key={key}>
              {trailCopies.map((k) => {
                const trailProgress = Math.max(progress - k * 0.06, 0);
                const trailX = fromPos + (toPos - fromPos) * trailProgress;
                return (
                  <span
                    key={k}
                    style={{
                      position: "absolute",
                      left: trailX,
                      top: 0,
                      display: "inline-block",
                      whiteSpace: "pre",
                      opacity: 0.12 / k,
                    }}
                  >
                    {toChars[pair.toIndex]}
                  </span>
                );
              })}
              <span style={{ position: "absolute", left: x, top: 0, display: "inline-block", whiteSpace: "pre" }}>
                {toChars[pair.toIndex]}
              </span>
            </Fragment>
          );
        }
        if (pair.toIndex >= 0) {
          const enter = Math.max(0, Math.min(1, (t - 0.3) / 0.7));
          return (
            <span
              key={key}
              style={{
                position: "absolute",
                left: toX[pair.toIndex],
                top: 0,
                display: "inline-block",
                whiteSpace: "pre",
                opacity: enter,
                filter: `blur(${(1 - enter) * fontPx * 0.15}px)`,
                color: accentColor ?? theme.colors.accent,
              }}
            >
              {toChars[pair.toIndex]}
            </span>
          );
        }
        const exitP = Math.max(0, Math.min(1, t / 0.5));
        return (
          <span
            key={key}
            style={{
              position: "absolute",
              left: fromX[pair.fromIndex],
              top: 0,
              display: "inline-block",
              whiteSpace: "pre",
              opacity: 1 - exitP,
              filter: `blur(${exitP * fontPx * 0.15}px)`,
            }}
          >
            {fromChars[pair.fromIndex]}
          </span>
        );
      })}
    </div>
  );
}
