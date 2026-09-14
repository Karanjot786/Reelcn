/**
 * @title Core Stroke
 * @category lib
 * @description Pure stroke-width math behind theme.stroke's `brush` look, kept separate from core-math.ts so its one export stays easy to find and test on its own.
 * @tags stroke, brush, taper
 * @example
 * const width = baseWidth * strokeWidthProfile(0.5, "arrow"); // thickest mid-stroke
 */
import { random } from "remotion";

/**
 * Width multiplier at normalized arc-length position `t` (0-1 along a path drawn with `pathLength={1}`):
 * a parabola peaking at 1 in the middle and tapering to ~0.35 at both ends (a real brush stroke's
 * pressure curve), plus a small seeded irregularity so repeated strokes with the same seed always match
 * but different seeds don't look identical.
 */
export function strokeWidthProfile(t: number, seed: string): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  const taper = 0.35 + 0.65 * (1 - (2 * clamped - 1) ** 2);
  const wobble = 1 + 0.08 * (random(`${seed}-width-${Math.round(clamped * 20)}`) - 0.5);
  return taper * wobble;
}
