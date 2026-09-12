/**
 * @title Brand Sweep
 * @category transitions
 * @description Layered panels in the brand colors sweep diagonally across the frame, cover the cut, then peel away in reverse order onto the next scene.
 * @duration 30
 * @use Branded section breaks in explainers and launch videos
 * @use Moving between topics with the brand palette on screen
 * @tags wipe, panels, brand, diagonal, sweep
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={90}>
 *     <Chapter1 />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={brandSweep()} timing={linearTiming({ durationInFrames: 30 })} />
 *   <TransitionSeries.Sequence durationInFrames={90}>
 *     <Chapter2 />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useTheme, useViewport } from "./core";

export type BrandSweepProps = {
  /** Panel colors from back to front; the last one covers the cut. Defaults to the theme surface, highlight and accent. */
  colors?: string[];
  /** Which way the panels travel. */
  direction?: "right" | "left";
  /** Lean of the panel edges in degrees. */
  angle?: number;
};

function BrandSweepPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<BrandSweepProps>) {
  const theme = useTheme();
  const { width, height } = useViewport();
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: presentationProgress < 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>;
  }

  const colors = passedProps.colors ?? [theme.colors.surface, theme.colors.highlight, theme.colors.accent];
  const flip = passedProps.direction === "left";
  // Horizontal offset between the top and the middle of a leaning edge.
  const lean = (height / 2) * Math.tan(((passedProps.angle ?? 18) * Math.PI) / 180);
  // Front panels arrive last and leave first, so each color shows as a band on the way in and on the way out.
  const step = colors.length > 1 ? 0.16 / (colors.length - 1) : 0;
  const span = 0.48 - step * (colors.length - 1);
  const edge = (start: number) =>
    -lean +
    (width + 2 * lean) *
      interpolate(presentationProgress, [start, start + span], [0, 1], { ...CLAMP, easing: easings.gentle });
  const x = (value: number) => (flip ? width - value : value);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: presentationProgress >= 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      {colors.map((color, index) => {
        const lead = edge(index * step);
        const trail = edge(1 - index * step - span);
        if (lead <= trail) return null;
        return (
          <AbsoluteFill
            key={index}
            style={{
              background: color,
              clipPath: `polygon(${x(trail + lean)}px 0, ${x(lead + lean)}px 0, ${x(lead - lean)}px ${height}px, ${x(trail - lean)}px ${height}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function brandSweep(props: BrandSweepProps = {}): TransitionPresentation<BrandSweepProps> {
  return { component: BrandSweepPresentation, props };
}
