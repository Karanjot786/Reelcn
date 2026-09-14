/**
 * @title Bento Grid
 * @category motion
 * @description Grid of themed feature tiles that reveal one after another and reflow to four, three or two columns by orientation.
 * @duration data-driven
 * @use Product feature overviews, launch recaps and "what's new" slides
 * @use Summing up four to eight short points on one screen
 * @avoid Cards in a single row or column, use `stagger`
 * @tags bento, grid, features, tiles, cards
 * @example
 * <Center>
 *   <BentoGrid
 *     tiles={[
 *       { title: "Themes", body: "Six presets, one prop", span: 2, accent: true },
 *       { title: "Responsive", body: "16:9, 9:16 and 1:1" },
 *       { title: "Deterministic", body: "Seeded, frame-driven" },
 *     ]}
 *   />
 * </Center>
 */
import type React from "react";
import { type AnimateEffect, effectStyle } from "./animate";
import { alpha, type MotionProps, staggerDelay, tween, useMotion, useSceneClock, useTheme, useViewport } from "./core";

export type BentoTile = {
  title: string;
  body?: string;
  /** Columns the tile covers. */
  span?: 1 | 2;
  /** Paint the tile in the accent color. */
  accent?: boolean;
};

export type BentoGridProps = MotionProps & {
  tiles: BentoTile[];
  /** Defaults to 4 in landscape, 3 in square and 2 in portrait. */
  columns?: number;
  /** Space between tiles, in design units. */
  gap?: number;
  /** Minimum tile height, in design units. */
  minHeight?: number;
  effect?: AnimateEffect;
  /** Frames between one tile's entrance and the next. Defaults to 0.1s. */
  step?: number;
  /** Tile fill. Defaults to the theme surface. */
  background?: string;
  /** Title color. Defaults to the theme foreground. */
  color?: string;
  /** Body color. Defaults to the theme muted color. */
  mutedColor?: string;
  /** Tile border. Defaults to the theme border. */
  borderColor?: string;
  /** Fill of accent tiles. Defaults to the theme accent. */
  accentColor?: string;
  /** Text on accent tiles. Defaults to the theme accent foreground. */
  accentForeground?: string;
  style?: React.CSSProperties;
  className?: string;
};

/** Column span per tile. A tile that no longer fits its row starts a new one and the tile before it widens to close the gap. */
function packSpans(spans: number[], columns: number) {
  const packed: number[] = [];
  let used = 0;
  for (const wanted of spans) {
    const span = Math.min(wanted, columns);
    if (used + span > columns) {
      packed[packed.length - 1] += columns - used;
      used = 0;
    }
    packed.push(span);
    used += span;
  }
  if (packed.length > 0) packed[packed.length - 1] += columns - used;
  return packed;
}

export function BentoGrid({
  tiles,
  columns,
  gap = 24,
  minHeight = 190,
  effect = "up",
  step,
  background,
  color,
  mutedColor,
  borderColor,
  accentColor,
  accentForeground,
  style,
  className,
  ...motion
}: BentoGridProps) {
  const theme = useTheme();
  const { u, orientation } = useViewport();
  const m = useMotion(motion);
  const sceneClock = useSceneClock();
  const cols = columns ?? (orientation === "landscape" ? 4 : orientation === "square" ? 3 : 2);
  const spans = packSpans(
    tiles.map((tile) => tile.span ?? 1),
    cols,
  );
  const frames = step ?? Math.round(m.fps * 0.1);
  const delayFor = (index: number, count: number) => sceneClock?.delayFor(index, count) ?? staggerDelay(index, count, { step: frames });

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `minmax(${u(minHeight)}px, auto)`,
        gap: u(gap),
        width: "100%",
        maxWidth: u(cols * 400),
        fontFamily: theme.fonts.body,
        opacity: 1 - m.exit,
        scale: String(1 - 0.03 * m.exit),
        ...style,
      }}
    >
      {tiles.map((tile, index) => {
        const p = tween(m.frame, m.fps, { from: m.delay + delayFor(index, tiles.length), duration: m.enterFrames, motion: m.preset });
        const fill = tile.accent ? (accentColor ?? theme.colors.accent) : (background ?? theme.colors.surface);
        return (
          <div
            key={index}
            style={{
              gridColumn: `span ${spans[index]}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: u(10),
              padding: u(34),
              borderRadius: u(theme.radius),
              background: fill,
              border: `1px solid ${tile.accent ? fill : (borderColor ?? theme.colors.border)}`,
              ...effectStyle(effect, p, u(40)),
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: theme.headingWeight,
                fontSize: u(40),
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: tile.accent
                  ? (accentForeground ?? theme.colors.accentForeground)
                  : (color ?? theme.colors.foreground),
              }}
            >
              {tile.title}
            </div>
            {tile.body && (
              <div
                style={{
                  fontSize: u(26),
                  lineHeight: 1.35,
                  color: tile.accent
                    ? alpha(accentForeground ?? theme.colors.accentForeground, 0.78)
                    : (mutedColor ?? theme.colors.muted),
                }}
              >
                {tile.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
