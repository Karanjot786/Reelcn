/**
 * @title Text Reveal
 * @category text
 * @description Headline that animates in by word, character or line with rise, blur, fade, scale, drop or mask effects.
 * @duration 30
 * @use Hero headlines, section titles and short-form hooks
 * @use Any line of up to about twelve words that needs an entrance
 * @tags headline, title, kinetic, stagger
 * @example
 * <Center>
 *   <TextReveal text="Ship videos, not keyframes" effect="blur" accentWords={["videos"]} />
 * </Center>
 */
import type React from "react";
import { graphemes, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type TextRevealEffect = "rise" | "blur" | "fade" | "scale" | "drop" | "mask";

export type TextRevealProps = MotionProps & {
  text: string;
  effect?: TextRevealEffect;
  /** What staggers in. `line` splits on "\n". */
  split?: "word" | "char" | "line";
  /** Frames between units. Defaults at 30fps: char 1, word 2, line 5. */
  stagger?: number;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  accentColor?: string;
  /** Words painted in the accent color. Case and punctuation are ignored. */
  accentWords?: string[];
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function unitStyle(effect: TextRevealEffect, progress: number, fontPx: number): React.CSSProperties {
  const opacity = Math.min(Math.max(progress, 0), 1);
  const hidden = 1 - progress;
  switch (effect) {
    case "rise":
      return { opacity, translate: `0 ${hidden * 0.45}em` };
    case "blur":
      return { opacity, filter: `blur(${Math.max(hidden, 0) * fontPx * 0.12}px)`, translate: `0 ${hidden * 0.15}em` };
    case "fade":
      return { opacity };
    case "scale":
      return { opacity, scale: String(0.5 + 0.5 * progress) };
    case "drop":
      return { opacity, translate: `0 ${-hidden * 0.6}em`, rotate: `${-hidden * 8}deg` };
    case "mask":
      return { translate: `0 ${hidden * 110}%` };
  }
}

export function TextReveal({
  text,
  effect = "rise",
  split = "word",
  stagger,
  size = 96,
  weight,
  font = "heading",
  color,
  accentColor,
  accentWords = [],
  align = "center",
  style,
  className,
  ...motion
}: TextRevealProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const step = stagger ?? (split === "char" ? 1 : Math.round(m.fps * (split === "word" ? 0.07 : 0.16)));
  const accents = new Set(accentWords.map(normalize));
  let unitIndex = 0;

  const renderUnit = (content: string, key: number, index: number) => {
    const progress = tween(m.frame, m.fps, {
      from: m.delay + index * step,
      duration: m.enterFrames,
      motion: m.preset,
    });
    const inner = (
      <span key={key} style={{ display: "inline-block", whiteSpace: "pre", ...unitStyle(effect, progress, fontPx) }}>
        {content}
      </span>
    );
    if (effect !== "mask") return inner;
    // A mask needs a clipping wrapper; the padding keeps descenders from being cut.
    return (
      <span
        key={key}
        style={{
          display: "inline-block",
          overflow: "hidden",
          verticalAlign: "top",
          paddingBottom: "0.12em",
          marginBottom: "-0.12em",
        }}
      >
        {inner}
      </span>
    );
  };

  const lines = text.split("\n").map((line, lineNumber) => {
    const lineIndex = unitIndex;
    if (split === "line") unitIndex++;
    const parts = line.split(/(\s+)/).map((word, wordNumber) => {
      // Whitespace stays a plain text node so the browser can still wrap the line.
      if (!word || /^\s+$/.test(word)) return word;
      const accent = accents.has(normalize(word)) ? { color: accentColor ?? theme.colors.accent } : undefined;
      if (split === "char") {
        return (
          <span key={wordNumber} style={{ display: "inline-block", whiteSpace: "nowrap", ...accent }}>
            {graphemes(word).map((char, charNumber) => renderUnit(char, charNumber, unitIndex++))}
          </span>
        );
      }
      // `line` stagger animates the whole line as one rigid unit below, so words here stay plain.
      if (split === "line")
        return accent ? (
          <span key={wordNumber} style={accent}>
            {word}
          </span>
        ) : (
          word
        );
      return (
        <span key={wordNumber} style={accent}>
          {renderUnit(word, wordNumber, unitIndex++)}
        </span>
      );
    });
    if (split !== "line") return <div key={lineNumber}>{parts}</div>;
    const progress = tween(m.frame, m.fps, {
      from: m.delay + lineIndex * step,
      duration: m.enterFrames,
      motion: m.preset,
    });
    return (
      <div
        key={lineNumber}
        style={effect === "mask" ? { overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" } : undefined}
      >
        <span style={{ display: "inline-block", ...unitStyle(effect, progress, fontPx) }}>{parts}</span>
      </div>
    );
  });

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        letterSpacing: font === "mono" ? 0 : "-0.025em",
        textAlign: align,
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: 1 - m.exit,
        translate: `0 ${-m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {lines}
    </div>
  );
}
