/**
 * @title Light Flash
 * @category transitions
 * @description Overexposes the outgoing scene into a flash of light, cuts at the peak, and lets the glow burn off the next scene.
 * @duration 20
 * @use Beat-synced cuts, reveals and before-and-after moments
 * @use Hiding the jump between two very different scenes
 * @tags flash, light, exposure, white, cut
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Before />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={lightFlash()} timing={linearTiming({ durationInFrames: 20 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <After />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, exitEasing, useTheme } from "./core";

export type LightFlashProps = {
  /** Flash color. Defaults to white. */
  color?: string;
  /** Soft tint at the edges of the flash. Defaults to the theme highlight. */
  tint?: string;
};

function LightFlashPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<LightFlashProps>) {
  const theme = useTheme();
  const entering = presentationDirection === "entering";
  const visible = entering ? presentationProgress >= 0.5 : presentationProgress < 0.5;
  // Builds up over the first half, peaks at the cut, then burns off over the second half.
  const glow = entering
    ? 1 - interpolate(presentationProgress, [0.5, 1], [0, 1], { ...CLAMP, easing: easings.smooth })
    : interpolate(presentationProgress, [0, 0.5], [0, 1], { ...CLAMP, easing: exitEasing });
  const color = passedProps.color ?? "#ffffff";
  const tint = passedProps.tint ?? theme.colors.highlight;

  return (
    <AbsoluteFill style={{ opacity: visible ? 1 : 0 }}>
      <AbsoluteFill
        style={{
          filter: glow > 0 ? `brightness(${1 + glow * 1.4}) saturate(${1 - glow * 0.5})` : undefined,
          scale: String(1 + glow * 0.04),
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: glow ** 1.5,
          background: `radial-gradient(circle at 50% 50%, ${color} 35%, color-mix(in srgb, ${color} 70%, ${tint}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}

export function lightFlash(props: LightFlashProps = {}): TransitionPresentation<LightFlashProps> {
  return { component: LightFlashPresentation, props };
}
