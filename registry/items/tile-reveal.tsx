/**
 * @title Tile Reveal
 * @category transitions
 * @description A grid of tiles pops in over the outgoing scene in a diagonal or seeded wave, then clears the same way onto the next scene.
 * @duration 36
 * @use Openers and section breaks with a designed, grid-based feel
 * @use Moving between portfolio, gallery or dashboard scenes
 * @tags tiles, grid, mosaic, stagger, pixel
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Gallery />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={tileReveal({ pattern: "random" })} timing={linearTiming({ durationInFrames: 36 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Project />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { CLAMP, easings, useTheme, useViewport } from "./core";

export type TileRevealProps = {
  /** Columns in the grid. Defaults to one per 200 design units of width. */
  cols?: number;
  /** Rows in the grid. Defaults to one per 200 design units of height. */
  rows?: number;
  /** `diagonal` sweeps from the top-left corner; `random` scatters the tiles in a seeded order. */
  pattern?: "diagonal" | "random";
  seed?: string | number;
  /** Tile color. Defaults to the theme accent. */
  color?: string;
};

/** How far apart the first and last tiles start, and how long each tile takes, as fractions of the transition. */
const SPREAD = 0.26;
const SPAN = 0.22;

function TileRevealPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<TileRevealProps>) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: presentationProgress < 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>;
  }

  const cols = Math.max(1, Math.round(passedProps.cols ?? width / u(200)));
  const rows = Math.max(1, Math.round(passedProps.rows ?? height / u(200)));
  const { pattern = "diagonal", seed = "tile-reveal" } = passedProps;
  const color = passedProps.color ?? theme.colors.accent;
  const at = (start: number) =>
    interpolate(presentationProgress, [start, start + SPAN], [0, 1], { ...CLAMP, easing: easings.gentle });
  const tiles: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      // 0 for the first tile to move, 1 for the last.
      const order = pattern === "random" ? random(`${seed}-${index}`) : (row + col) / Math.max(1, rows + cols - 2);
      // Every tile is fully shut from 0.48 to 0.52, which hides the cut.
      const size = at(order * SPREAD) - at(0.52 + order * SPREAD);
      if (size <= 0) continue;
      const left = Math.floor((col * width) / cols);
      const top = Math.floor((row * height) / rows);
      tiles.push(
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width: Math.ceil(((col + 1) * width) / cols) - left,
            height: Math.ceil(((row + 1) * height) / rows) - top,
            background: color,
            scale: String(size),
            // Small tiles are dots that square off as they grow, so the full grid is seamless.
            borderRadius: `${(1 - size) * 50}%`,
          }}
        />,
      );
    }
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: presentationProgress >= 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      {tiles}
    </AbsoluteFill>
  );
}

export function tileReveal(props: TileRevealProps = {}): TransitionPresentation<TileRevealProps> {
  return { component: TileRevealPresentation, props };
}
