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
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity,
              scale: String(zoom),
              color: i % 2 === 1 ? (accentColor ?? theme.colors.accent) : undefined,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
}
