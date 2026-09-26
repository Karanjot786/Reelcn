/**
 * @title Word Rotator
 * @category text
 * @description Sentence with one slot that cycles through a list of words by sliding, flipping or blurring them in place.
 * @duration sustained
 * @use Taglines that list audiences, platforms or benefits
 * @use Hooks such as "Made for creators / startups / agencies"
 * @avoid Emphasizing one fixed phrase — use `highlight`
 * @tags rotate, cycle, swap, words, tagline
 * @example
 * <Center>
 *   <WordRotator before="Made for" words={["creators", "startups", "agencies"]} effect="slide" />
 * </Center>
 */
import type React from "react";
import {
  clamp01,
  graphemes,
  type MotionProps,
  measurePx,
  tween,
  useMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type WordRotatorEffect = "slide" | "flip" | "blur";

export type WordRotatorProps = MotionProps & {
  /** Text before the slot. */
  before?: string;
  /** Words cycled through the slot. */
  words: string[];
  /** Text after the slot. */
  after?: string;
  /** Frames each word rests before the next one arrives. Defaults to 1s. `duration` sets the swap length. */
  holdFrames?: number;
  effect?: WordRotatorEffect;
  /** `widest`: the slot always fits the widest word, so the sentence never moves. `word`: it eases to each word's width. */
  fit?: "widest" | "word";
  /** Start over after the last word. `false` stops on it. */
  loop?: boolean;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  /** Color of the rotating words. Defaults to the theme accent. */
  accentColor?: string;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

/** A word at swap progress `p`: the arriving word goes from offset 1 to 0, the leaving one from 0 to -1. */
function wordStyle(effect: WordRotatorEffect, p: number, arriving: boolean, fontPx: number): React.CSSProperties {
  const offset = arriving ? 1 - p : -p;
  const opacity = Math.min(Math.max(1 - Math.abs(offset), 0), 1);
  switch (effect) {
    case "slide":
      return { translate: `0 ${offset * 105}%` };
    case "flip":
      return {
        opacity,
        transform: `perspective(${fontPx * 4}px) rotateX(${-offset * 90}deg)`,
        backfaceVisibility: "hidden",
      };
    case "blur":
      return { opacity, filter: `blur(${Math.abs(offset) * fontPx * 0.12}px)`, translate: `0 ${offset * 0.25}em` };
  }
}

export function WordRotator({
  before,
  words,
  after,
  holdFrames,
  effect = "slide",
  fit = "widest",
  loop = true,
  size = 96,
  weight,
  font = "heading",
  color,
  accentColor,
  align = "center",
  style,
  className,
  ...motion
}: WordRotatorProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const cycle = (holdFrames ?? m.fps) + m.enterFrames;
  const elapsed = Math.max(0, Math.floor((m.frame - m.delay) / cycle));
  const step = loop ? elapsed : Math.min(elapsed, words.length - 1);
  const current = step % words.length;
  const previous = step > 0 ? (step - 1) % words.length : -1;
  const swapStart = m.delay + step * cycle;
  // The leaving word goes first on an ease-in; the arriving one follows on the theme's motion, a beat later,
  // so the two are never both half-legible. The very first word has nothing to wait for.
  const lead = step > 0 ? Math.round(m.enterFrames * 0.3) : 0;
  const pIn = tween(m.frame, m.fps, { from: swapStart + lead, duration: m.enterFrames - lead, motion: m.preset });
  const pOut = clamp01((m.frame - swapStart) / Math.max(m.enterFrames * 0.55, 1)) ** 2;

  const styleFor = (index: number): React.CSSProperties => {
    if (index === current) return wordStyle(effect, pIn, true, fontPx);
    if (index === previous && previous !== current) return wordStyle(effect, pOut, false, fontPx);
    return { visibility: "hidden" };
  };

  const fontWeight = weight ?? (font === "heading" ? theme.headingWeight : 500);
  const fontString = `${fontWeight} ${fontPx}px ${theme.fonts[font]}`;
  const gate = useTextMetrics(
    words.join(" "),
    { fontFamily: theme.fonts[font], fontSize: fontPx, fontWeight },
    {
      skip: fit !== "word",
    },
  );
  const tracking = font === "mono" ? 0 : -0.025 * fontPx;
  const widthOf = (index: number) =>
    index < 0 ? 0 : measurePx(words[index], fontString) + tracking * graphemes(words[index]).length;
  const slotWidth =
    fit === "word" && gate.ready
      ? widthOf(previous < 0 ? current : previous) +
        (widthOf(current) - widthOf(previous < 0 ? current : previous)) * clamp01(pIn)
      : undefined;

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight,
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        letterSpacing: font === "mono" ? 0 : "-0.025em",
        textAlign: align,
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: m.presence,
        translate: `0 ${-m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {before ? `${before} ` : null}
      {/* Every word sits in the same grid cell, so the slot is natively as wide as the widest one. */}
      <span
        style={{
          display: "inline-grid",
          justifyItems: "start",
          width: slotWidth,
          color: accentColor ?? theme.colors.accent,
          // Sliding words are clipped to the line; the padding keeps descenders and overhangs from being cut.
          ...(effect === "slide" && {
            overflow: "hidden",
            verticalAlign: "top",
            padding: "0 0.06em 0.12em",
            margin: "0 -0.06em -0.12em",
          }),
        }}
      >
        {words.map((word, index) => (
          <span key={index} style={{ gridArea: "1 / 1", whiteSpace: "nowrap", ...styleFor(index) }}>
            {word}
          </span>
        ))}
      </span>
      {after ? ` ${after}` : null}
    </div>
  );
}
