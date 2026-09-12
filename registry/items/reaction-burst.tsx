/**
 * @title Reaction Burst
 * @category overlays
 * @description Live-stream style reactions (heart, thumbs-up, star, flame) that pop in, float up with a sway and fade.
 * @duration 100
 * @use Showing audience love for a clip, a hot take or a product reveal
 * @use Social proof in short-form and live-stream style edits
 * @avoid A single celebratory moment — use `confetti`
 * @tags reactions, hearts, likes, live, social, float
 * @example
 * <Sequence from={30} durationInFrames={120}>
 *   <ReactionBurst icons={["heart", "flame"]} count={16} />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill, random } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type ReactionIcon = "heart" | "thumbsUp" | "star" | "flame";

export type ReactionBurstProps = MotionProps & {
  /** Where reactions spawn, in % of the canvas. Defaults to the lower right. */
  origin?: { x: number; y: number };
  /** Number of reactions. */
  count?: number;
  /** Icons to draw from; each reaction picks one (seeded). */
  icons?: ReactionIcon[];
  /** Frames between spawns. Defaults to 0.12s. */
  interval?: number;
  /** Frames each reaction lives. Defaults to 1.8s. */
  life?: number;
  /** How far reactions float up, in design units. */
  rise?: number;
  /** Side-to-side sway in design units. */
  sway?: number;
  /** Icon size in design units. */
  size?: number;
  /** Fill per icon. Defaults: heart and thumbs-up use the theme accent, star and flame the highlight. */
  colors?: Partial<Record<ReactionIcon, string>>;
  seed?: string | number;
  style?: React.CSSProperties;
  className?: string;
};

/** Five-point star with softened tips, built from ten alternating radii. */
const STAR = `${Array.from({ length: 10 }, (_, i) => {
  const radius = i % 2 === 0 ? 10.4 : 4.6;
  const angle = (i * Math.PI) / 5 - Math.PI / 2;
  return `${i === 0 ? "M" : "L"}${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12.8 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ")}Z`;

/** Hand-drawn 24 × 24 glyphs. Plain paths, so they render the same on every machine (unlike emoji fonts). */
const GLYPHS: Record<ReactionIcon, string[]> = {
  heart: [
    "M12 20.6C12 20.6 2.8 14.9 2.8 8.8C2.8 5.9 5 3.8 7.7 3.8C9.6 3.8 11.1 4.9 12 6.4C12.9 4.9 14.4 3.8 16.3 3.8C19 3.8 21.2 5.9 21.2 8.8C21.2 14.9 12 20.6 12 20.6Z",
  ],
  thumbsUp: [
    "M3 10.6C3 10 3.4 9.6 4 9.6H6.4C7 9.6 7.4 10 7.4 10.6V19.4C7.4 20 7 20.4 6.4 20.4H4C3.4 20.4 3 20 3 19.4Z",
    "M9 10.2L12.6 4.2C13.2 3.2 14.7 3.4 15 4.5C15.1 4.9 15.1 5.3 15 5.7L14.2 9H19.1C20.3 9 21.2 10.1 21 11.3L19.8 18.7C19.6 19.7 18.8 20.4 17.8 20.4H9Z",
  ],
  star: [STAR],
  flame: [
    "M12 2.4C12.6 6 16 7.9 17.6 11C19.6 14.9 17.4 21.2 12 21.2C6.6 21.2 4.4 15.9 6.3 12.1C7.1 10.5 8.4 9.6 8.9 7.9C9.9 9.2 10.1 10.6 10 11.8C11.8 10 12.6 6.5 12 2.4Z",
  ],
};

/** The flame's inner tongue, painted in a lighter tint of the flame color. */
const FLAME_CORE =
  "M12 12.6C13.5 14 14.7 15.4 14.4 17.3C14.1 19 13.1 19.9 12 19.9C10.6 19.9 9.5 18.8 9.7 17.2C9.9 15.6 11.4 14.8 12 12.6Z";

export function ReactionBurst({
  origin = { x: 82, y: 78 },
  count = 12,
  icons = ["heart", "thumbsUp", "star", "flame"],
  interval,
  life,
  rise = 560,
  sway = 34,
  size = 72,
  colors = {},
  seed = "reactions",
  style,
  className,
  ...motion
}: ReactionBurstProps) {
  const theme = useTheme();
  const { u, width, height } = useViewport();
  const m = useMotion(motion);
  const step = interval ?? Math.round(m.fps * 0.12);
  const lifeFrames = life ?? Math.round(m.fps * 1.8);
  const x0 = (origin.x / 100) * width;
  const y0 = (origin.y / 100) * height;
  const fills: Record<ReactionIcon, string> = {
    heart: colors.heart ?? theme.colors.accent,
    thumbsUp: colors.thumbsUp ?? theme.colors.accent,
    star: colors.star ?? theme.colors.highlight,
    flame: colors.flame ?? theme.colors.highlight,
  };

  const reactions = Array.from({ length: count }, (_, i) => {
    const r = (key: string) => random(`${seed}-${i}-${key}`);
    const spawn = m.delay + i * step + Math.floor(r("jitter") * step);
    const age = m.frame - spawn;
    if (age < 0 || age >= lifeFrames) return null;
    const p = age / lifeFrames;
    const icon = icons.length > 0 ? icons[Math.floor(r("icon") * icons.length)] : "heart";
    const fill = fills[icon];
    const pop = tween(m.frame, m.fps, { from: spawn, duration: Math.round(m.enterFrames / 2), motion: m.preset });
    const phase = r("phase") * Math.PI * 2;
    // Rises fast, then drifts: an ease-out on height with a widening sway.
    const lift = 1 - (1 - p) ** 1.6;
    const x =
      x0 +
      Math.sin(p * Math.PI * (1.4 + r("frequency")) + phase) * u(sway) * (0.4 + 0.6 * p) +
      (r("drift") - 0.5) * u(sway) * 1.5 * p;
    const y = y0 - u(rise) * (0.75 + 0.25 * r("rise")) * lift;
    const s = u(size) * (0.8 + 0.4 * r("size"));
    return (
      <svg
        key={i}
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={s}
        height={s}
        style={{
          position: "absolute",
          left: x - s / 2,
          top: y - s / 2,
          overflow: "visible",
          opacity: Math.min((1 - p) / 0.35, 1),
          scale: String(Math.max(pop, 0)),
          rotate: `${Math.sin(p * Math.PI * 2 + phase) * 10}deg`,
          filter: `drop-shadow(0 ${u(6)}px ${u(10)}px ${alpha("#000000", 0.3)})`,
        }}
      >
        {GLYPHS[icon].map((d, index) => (
          <path key={index} d={d} fill={fill} stroke={fill} strokeWidth={1.2} strokeLinejoin="round" />
        ))}
        {icon === "flame" && <path d={FLAME_CORE} fill={`color-mix(in srgb, ${fill} 40%, #ffffff)`} />}
      </svg>
    );
  });

  return (
    <AbsoluteFill className={className} style={{ pointerEvents: "none", opacity: 1 - m.exit, ...style }}>
      {reactions}
    </AbsoluteFill>
  );
}
