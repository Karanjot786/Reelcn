/**
 * @title Whip Pan
 * @category transitions
 * @description A fast directional blur hides a hard cut between two scenes, like a camera whipped from one framing to the next.
 * @duration 18
 * @use Fast-paced cuts between shots, especially ones that already move the same direction
 * @use Sports, action and hype-reel scene changes
 * @tags whip, pan, blur, speed, directional, cut
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneA />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={whipPan({ axis: "x" })} timing={linearTiming({ durationInFrames: 18 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneB />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import { useId } from "react";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { coverPhase, punchCurve, useViewport } from "./core";

export type WhipPanProps = {
  /** Which axis the blur runs along. */
  axis?: "x" | "y";
  /** Blur/overscan multiplier. 1 is the tuned default. */
  strength?: number;
};

/** Sharper than a plain parabola — the research's own whip pan uses `p≈3`. */
const PUNCH_EXPONENT = 3;

function WhipPanPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<WhipPanProps>) {
  const { u, width, height } = useViewport();
  const axis = passedProps.axis ?? "x";
  const strength = passedProps.strength ?? 1;
  const exiting = presentationDirection === "exiting";
  const { showsNext } = coverPhase(presentationProgress);
  const visible = exiting ? !showsNext : showsNext;
  const shaped = punchCurve(presentationProgress, PUNCH_EXPONENT);
  // Parabola peaking mid-transition, exactly 0 at both ends since `shaped` already is.
  const speed = 4 * shaped * (1 - shaped);
  const shortSide = Math.min(width, height);
  const sigma = speed * strength * u(20);
  const overscan = 1 + (6 * sigma) / shortSide;
  // Per-instance, not per-axis/direction: two whip-pan transitions on screen at once (a split-screen, a
  // nested Series) must not collide on the same SVG filter id (`core.tsx:768`, `glitch.tsx:50`, `grain.tsx:53`).
  const filterId = `whip-pan-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hasBlur = sigma > 0.01;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: visible ? 1 : 0 }}>
      {hasBlur && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={axis === "x" ? `${sigma},0` : `0,${sigma}`} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill style={{ transform: `scale(${overscan})`, filter: hasBlur ? `url(#${filterId})` : undefined }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function whipPan(props: WhipPanProps = {}): TransitionPresentation<WhipPanProps> {
  return { component: WhipPanPresentation, props };
}
