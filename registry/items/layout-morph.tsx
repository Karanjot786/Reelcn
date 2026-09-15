/**
 * @title Layout Morph
 * @category motion
 * @description Images rearrange between named layouts (grid, mosaic, strip) with a closed-form tile morph — each image is always rendered full-canvas and only its clip-path window moves, so nothing ever reflows or distorts mid-morph.
 * @duration data-driven
 * @use A brand collage or portfolio grid that rearranges itself
 * @use Any beat that needs several images to feel like one continuous composition, not a cut
 * @avoid Two images — use `split-screen` or a plain crossfade
 * @tags layout, morph, grid, mosaic, collage, flip
 * @example
 * <LayoutMorph
 *   items={[{ src: "/a.jpg" }, { src: "/b.jpg" }, { src: "/c.jpg" }, { src: "/d.jpg" }]}
 *   layouts={[{ at: 0, layout: "grid" }, { at: 1.5, layout: "mosaic" }]}
 * />
 */
import type React from "react";
import { AbsoluteFill, Img } from "remotion";
import {
  clamp01,
  flipInterpolate,
  layoutRectsFor,
  type MotionProps,
  type NamedLayout,
  tween,
  useMotion,
  useTheme,
  useViewport,
} from "./core";

export type LayoutMorphProps = MotionProps & {
  items: { src: string }[];
  /** `at` in seconds. The layout holds at the first entry's arrangement until the next `at`. */
  layouts: { at: number; layout: NamedLayout }[];
  style?: React.CSSProperties;
  className?: string;
};

export function LayoutMorph({ items, layouts, style, className, ...motion }: LayoutMorphProps) {
  const theme = useTheme();
  const { u, width, height, orientation } = useViewport();
  const m = useMotion(motion);
  const sorted = layouts.slice().sort((a, b) => a.at - b.at);
  const atFrame = (l: { at: number }) => m.delay + Math.round(l.at * m.fps);
  let prevIndex = 0;
  for (let i = 0; i < sorted.length; i++) if (atFrame(sorted[i]) <= m.frame) prevIndex = i;
  const prev = sorted[prevIndex] ?? { at: 0, layout: "grid" as NamedLayout };
  const next = sorted[prevIndex + 1];
  const fromRects = layoutRectsFor(prev.layout, items.length, orientation, { width, height });
  const toRects = next ? layoutRectsFor(next.layout, items.length, orientation, { width, height }) : fromRects;
  const t = next
    ? clamp01(
        tween(m.frame, m.fps, {
          from: atFrame(prev),
          duration: Math.max(1, atFrame(next) - atFrame(prev)),
          motion: m.preset,
        }),
      )
    : 1;

  return (
    <AbsoluteFill className={className} style={{ opacity: m.presence, ...style }}>
      {items.map((item, i) => {
        const rect = flipInterpolate(fromRects[i], toRects[i], t);
        const inset = `${rect.y}px ${width - rect.x - rect.width}px ${height - rect.y - rect.height}px ${rect.x}px`;
        return (
          <Img
            key={item.src}
            src={item.src}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width,
              height,
              objectFit: "cover",
              clipPath: `inset(${inset} round ${u(theme.radius)}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
