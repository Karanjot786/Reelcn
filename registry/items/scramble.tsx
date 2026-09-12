/**
 * @title Scramble
 * @category text
 * @description Decodes a line out of random glyphs, resolving characters left to right from a stable seed.
 * @duration data-driven
 * @use Tech, security and launch reveals
 * @use Names, codes or numbers that should feel computed
 * @avoid Long sentences — use `text-reveal`
 * @tags decode, cipher, glyphs, hacker, random
 * @example
 * <Center>
 *   <Scramble text="Access granted" font="mono" seed="login" />
 * </Center>
 */
import type React from "react";
import { random } from "remotion";
import { graphemes, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type ScrambleProps = MotionProps & {
  text: string;
  /** Picks the random glyphs. The same seed renders the same frames on every machine. */
  seed?: string | number;
  /** Glyphs shown while a character is still unresolved. */
  charset?: string;
  /** Frames between one character starting to scramble and the next. `duration` is how long each one scrambles. */
  stagger?: number;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  /** Color of unresolved glyphs. Defaults to the theme accent. */
  glyphColor?: string;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

export function Scramble({
  text,
  seed = "scramble",
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?",
  stagger,
  size = 96,
  weight,
  font = "heading",
  color,
  glyphColor,
  align = "center",
  style,
  className,
  ...motion
}: ScrambleProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const glyphs = graphemes(charset);
  const step = stagger ?? Math.max(1, Math.round(m.fps / 30));
  let index = 0;

  const renderChar = (char: string, key: number) => {
    const i = index++;
    const start = m.delay + i * step;
    const resolved = m.frame >= start + m.enterFrames;
    const glyph =
      m.frame >= start && !resolved
        ? glyphs[Math.floor(random(`scramble-${seed}-${i}-${m.frame}`) * glyphs.length)]
        : null;
    // The real character always holds the layout; the glyph is drawn over it, so the line never jitters.
    return (
      <span key={key} style={{ position: "relative", display: "inline-block" }}>
        <span style={{ visibility: resolved ? "visible" : "hidden" }}>{char}</span>
        {glyph !== null && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              color: glyphColor ?? theme.colors.accent,
            }}
          >
            {glyph}
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        letterSpacing: font === "mono" ? 0 : "-0.02em",
        textAlign: align,
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: 1 - m.exit,
        translate: `0 ${-m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {text.split(/(\s+)/).map((word, wordNumber) =>
        // Whitespace stays a plain text node so the browser can still wrap the line.
        !word || /^\s+$/.test(word) ? (
          word
        ) : (
          <span key={wordNumber} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {graphemes(word).map(renderChar)}
          </span>
        ),
      )}
    </div>
  );
}
