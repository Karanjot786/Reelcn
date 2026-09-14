/**
 * @title Word Push
 * @category text
 * @description Words accelerate in one after another, each adding a small cumulative zoom so the whole line reads as one continuous push.
 * @duration data-driven
 * @use Hook lines and headline builds on Shorts/Reels-style content
 * @use Any word-by-word reveal that should speed up, not stay evenly paced
 * @tags word, push, accelerando, kinetic, hook
 * @example
 * <Center>
 *   <WordPush words={["Ship", "videos,", "not", "keyframes"]} />
 * </Center>
 */
import type React from "react";
import { geometricCadence, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type WordPushOptions = { gap?: number; accel?: number };

/** One entry per word: `delay` in frames (a geometric accelerando, not a constant stagger), `zoomBoost`
 * a small cumulative scale so later words read as part of one continuous push. Pure — no measurement,
 * no hook; positions come from ordinary inline-block DOM flow in the consumer, which already measures
 * the real font the way the browser lays out any text (see the Phase 3a plan's Deviation 3). */
export function useWordPush(
  words: string[],
  { gap = 6, accel = 0.82 }: WordPushOptions = {},
): { delay: number; zoomBoost: number }[] {
  const entries: { delay: number; zoomBoost: number }[] = [];
  for (let i = 0; i < words.length; i++) {
    entries.push({ delay: geometricCadence(i, gap, accel), zoomBoost: 0.035 * i });
  }
  return entries;
}

export type WordPushProps = MotionProps & {
  words: string[];
  gap?: number;
  accel?: number;
  size?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  accentColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function WordPush({
  words,
  gap,
  accel,
  size = 96,
  font = "heading",
  color,
  accentColor,
  style,
  className,
  ...motion
}: WordPushProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const cadence = useWordPush(words, { gap, accel });

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: font === "heading" ? theme.headingWeight : 500,
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        textAlign: "center",
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: 1 - m.exit,
      }}
    >
      {words.map((word, i) => {
        const entry = cadence[i];
        const progress = tween(m.frame, m.fps, {
          from: m.delay + entry.delay,
          duration: m.enterFrames,
          motion: m.preset,
        });
        const opacity = Math.min(Math.max(progress, 0), 1);
        const zoom = 1 + entry.zoomBoost * progress;
        // The cumulative zoom sells the "push", but scaling a word about its own center bleeds its
        // painted glyphs past its unscaled layout box on both sides — with only a plain space
        // character's width reserved between words, that bleed (from the words on both sides of a gap)
        // eats straight through it and merges them (see the visual-check bug). Anchoring the scale to
        // the word's own left edge confines its growth to bleeding rightward into its own trailing gap
        // instead of also eating into the gap before it, so each gap only has to outgrow the one word's
        // own bleed — proportional to `zoomBoost` (how much it grows) and its length (how far that
        // growth reaches) — plus a fixed safety pad. Later words push harder and bleed further, so the
        // reserved gap actually grows even as the *visible* gap (what's left after bleed eats into it)
        // keeps shrinking, which is what should read as the accelerando never fully closing the gap.
        const gapEm = i < words.length - 1 ? Math.max(0.3, entry.zoomBoost * word.length * 0.6 + 0.2) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity,
              scale: String(zoom),
              transformOrigin: "0% 50%",
              marginRight: gapEm ? `${gapEm}em` : undefined,
              color: i % 2 === 1 ? (accentColor ?? theme.colors.accent) : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
