/**
 * @title Animate
 * @category motion
 * @description Wrap anything (logo, screenshot, card, image) to give it a themed enter and exit. The swiss-army knife of reelcn.
 * @duration 18
 * @use Entrances and exits for logos, screenshots, cards and anything without its own animation
 * @use Quick prototypes before reaching for a dedicated component
 * @avoid Headlines — use `text-reveal`
 * @tags wrapper, entrance, exit, fade, slide
 * @example
 * <Animate effect="up" delay={10}>
 *   <Img src={staticFile("logo.png")} />
 * </Animate>
 */
import type React from "react";
import { type MotionProps, useMotion, useViewport } from "./core";

export type AnimateEffect = "fade" | "up" | "down" | "left" | "right" | "scale" | "pop" | "blur" | "zoom" | "none";

export type AnimateProps = MotionProps & {
  effect?: AnimateEffect;
  exitEffect?: AnimateEffect;
  /** Travel distance for directional effects, in design units. */
  distance?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

/** Style at progress `p` (0 = hidden, 1 = shown). */
export function effectStyle(effect: AnimateEffect, p: number, travel: number): React.CSSProperties {
  const hidden = 1 - p;
  const opacity = Math.min(Math.max(p, 0), 1);
  switch (effect) {
    case "none":
      return {};
    case "fade":
      return { opacity };
    case "up":
      return { opacity, translate: `0 ${hidden * travel}px` };
    case "down":
      return { opacity, translate: `0 ${-hidden * travel}px` };
    case "left":
      return { opacity, translate: `${hidden * travel}px 0` };
    case "right":
      return { opacity, translate: `${-hidden * travel}px 0` };
    case "scale":
      return { opacity, scale: String(0.85 + 0.15 * p) };
    case "pop":
      return { opacity, scale: String(0.4 + 0.6 * p) };
    case "blur":
      return { opacity, filter: `blur(${Math.max(hidden, 0) * travel * 0.25}px)` };
    case "zoom":
      return { opacity, scale: String(1.25 - 0.25 * p) };
  }
}

export function Animate({
  effect = "up",
  exitEffect = "fade",
  distance = 60,
  children,
  style,
  className,
  ...motion
}: AnimateProps) {
  const { u } = useViewport();
  const m = useMotion(motion);
  const { opacity: enterOpacity = 1, ...enter } = effectStyle(effect, m.enter, u(distance));
  const { opacity: exitOpacity = 1, ...exit } = effectStyle(exitEffect, 1 - m.exit, u(distance));
  return (
    <div
      className={className}
      style={{ ...style, opacity: Number(style?.opacity ?? 1) * Number(enterOpacity) * Number(exitOpacity) }}
    >
      <div style={exit}>
        <div style={enter}>{children}</div>
      </div>
    </div>
  );
}
