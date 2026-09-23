/**
 * @title Zoom Through
 * @category transitions
 * @description Pushes through the outgoing scene and pulls back out of the incoming one, like the camera flew through the cut.
 * @duration 24
 * @use Feature-to-feature walkthroughs and product demo cuts
 * @use Any transition that should feel like forward momentum, not a flat cut
 * @tags zoom, push, dolly, scale, blur
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <FeatureOne />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={zoomThrough()} timing={linearTiming({ durationInFrames: 24 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <FeatureTwo />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { useId } from "react";
import { AbsoluteFill, Easing } from "remotion";
import { coverPhase, useViewport } from "./core";

export type ZoomThroughProps = {
  /** How far the camera pushes through, as a scale ratio. */
  maxScale?: number;
  /** Peak isotropic blur in design units. */
  blurPeak?: number;
  /** `"in"` pushes through the outgoing scene and pulls back into the incoming one (default). `"out"` reverses it. */
  direction?: "in" | "out";
};

function ZoomThroughPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<ZoomThroughProps>) {
  const { u } = useViewport();
  const maxScale = passedProps.maxScale ?? 2.4;
  const blurPeak = passedProps.blurPeak ?? 8;
  const direction = passedProps.direction ?? "in";
  const exiting = presentationDirection === "exiting";
  const { cover, reveal, showsNext } = coverPhase(presentationProgress);
  const visible = exiting ? !showsNext : showsNext;
  // Speed peaks at the cut: accelerate into it, decelerate out of it (both slopes are 3, so they match).
  const t = exiting ? Easing.in(Easing.cubic)(cover) : Easing.out(Easing.cubic)(reveal);
  // Blur is max exactly at the swap so the cut hides inside it, and 0 at both ends (displace-zero contract).
  const sigma = (exiting ? cover : 1 - reveal) * u(blurPeak);
  const pinch = 1 / maxScale;
  // Scale in log space: equal ratios per frame read as constant camera speed.
  const exitScale = direction === "in" ? maxScale ** t : pinch ** t;
  const enterScale = direction === "in" ? pinch ** (1 - t) : maxScale ** (1 - t);
  const scale = exiting ? exitScale : enterScale;
  // Per-instance, not per-direction: see whip-pan's identical fix for why a static id collides.
  const filterId = `zoom-through-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hasBlur = sigma > 0.01;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: visible ? 1 : 0 }}>
      {hasBlur && (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={sigma} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: hasBlur ? `url(#${filterId})` : undefined }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function zoomThrough(props: ZoomThroughProps = {}): TransitionPresentation<ZoomThroughProps> {
  return { component: ZoomThroughPresentation, props };
}
