/**
 * @title Marquee
 * @category motion
 * @description Endless ticker of words or logos that scrolls at a steady speed with softly faded edges.
 * @duration sustained
 * @use Logo walls, keyword bands, "as seen in" strips and breaking-news tickers
 * @use A tilted accent band behind a headline for extra movement
 * @avoid A short list that should arrive and then hold still, use `stagger`
 * @tags marquee, ticker, scroll, logos, band, loop
 * @example
 * <Marquee items={["Remotion", "React", "TypeScript", "shadcn"]} speed={180} />
 */
import type React from "react";
import { Children } from "react";
import { type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type MarqueeProps = MotionProps & {
  /** Words to scroll. Ignored when `children` are given. */
  items?: string[];
  /** Custom elements to scroll instead of `items`. Each one is assumed to be at least one font size wide. */
  children?: React.ReactNode;
  /** Scroll speed in design units per second. */
  speed?: number;
  direction?: "left" | "right";
  /** Drawn between items. Defaults to a small four-point star in the accent color. */
  separator?: React.ReactNode;
  /** Font size in design units. */
  size?: number;
  font?: "heading" | "body" | "mono";
  weight?: number;
  /** Space on each side of the separator, in design units. */
  gap?: number;
  /** Width of the faded edges, in design units. 0 turns the fade off. */
  fade?: number;
  color?: string;
  /** Default separator color. Defaults to the theme accent. */
  accentColor?: string;
  /** Band fill. Transparent by default. */
  background?: string;
  style?: React.CSSProperties;
  className?: string;
};

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="0.42em" height="0.42em" style={{ display: "block", flexShrink: 0 }} aria-hidden>
      <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill={color} />
    </svg>
  );
}

export function Marquee({
  items = [],
  children,
  speed = 160,
  direction = "left",
  separator,
  size = 64,
  font = "heading",
  weight,
  gap = 40,
  fade = 160,
  color,
  accentColor,
  background,
  style,
  className,
  ...motion
}: MarqueeProps) {
  const theme = useTheme();
  const { u, width } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const gapPx = u(gap);
  const custom = Children.toArray(children);
  const units: React.ReactNode[] = custom.length > 0 ? custom : items;
  const mark = separator ?? <Star color={accentColor ?? theme.colors.accent} />;

  // No measuring: the track never wraps. It holds enough copies to cover the canvas plus the whole distance it will
  // travel, using a conservative lower bound for each copy's width (0.2em per character, 1em per custom element).
  const minCopyWidth = units.reduce<number>(
    (sum, unit) => sum + 2 * gapPx + fontPx * 0.42 + fontPx * (typeof unit === "string" ? unit.length * 0.2 : 1),
    0,
  );
  const travel = (m.durationInFrames / m.fps) * u(speed);
  const copies = minCopyWidth > 0 ? Math.min(Math.ceil((width + travel) / minCopyWidth) + 1, 400) : 0;
  const offset = (m.frame / m.fps) * u(speed);
  const fadePx = u(fade);
  const mask =
    fadePx > 0
      ? `linear-gradient(to right, transparent, #000 ${fadePx}px, #000 calc(100% - ${fadePx}px), transparent)`
      : undefined;

  const cells: React.ReactNode[] = [];
  for (let copy = 0; copy < copies; copy++) {
    units.forEach((unit, index) => {
      cells.push(
        <div
          key={`${copy}-${index}`}
          style={{ display: "flex", alignItems: "center", gap: gapPx, paddingRight: gapPx }}
        >
          <div style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{unit}</div>
          {mark}
        </div>,
      );
    });
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: direction === "left" ? "flex-start" : "flex-end",
        width: "100%",
        overflow: "hidden",
        paddingBlock: fontPx * 0.3,
        background,
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
        lineHeight: 1.1,
        letterSpacing: font === "heading" ? "-0.02em" : 0,
        color: color ?? theme.colors.foreground,
        maskImage: mask,
        WebkitMaskImage: mask,
        opacity: m.presence,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          paddingLeft: gapPx,
          translate: `${direction === "left" ? -offset : offset}px 0`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
