/**
 * @title Circle Burst
 * @category transitions
 * @description A colored circle bursts out from a point to cover the frame, then a second circle opens from the same point onto the next scene.
 * @duration 30
 * @use Moving from a point of interest, like a button, logo or face, into the next scene
 * @use Bold, playful scene changes in social clips
 * @tags circle, burst, iris, radial, reveal
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <AppScreen />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition
 *     presentation={circleBurst({ origin: { x: 80, y: 20 } })}
 *     timing={linearTiming({ durationInFrames: 30 })}
 *   />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <NextScreen />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useTheme, useViewport } from "./core";

export type CircleBurstProps = {
  /** Center of the burst, in percent of the frame. */
  origin?: { x: number; y: number };
  /** Circle color. Defaults to the theme accent. */
  color?: string;
  /** Thin ring that leads both circles. Defaults to the theme highlight. */
  ringColor?: string;
};

function CircleBurstPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<CircleBurstProps>) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;

  const origin = passedProps.origin ?? { x: 50, y: 50 };
  const cx = (origin.x / 100) * width;
  const cy = (origin.y / 100) * height;
  const ring = u(28);
  // Radius that reaches the farthest corner, plus the ring.
  const reach = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + ring;
  const cover = interpolate(presentationProgress, [0, 0.5], [0, 1], { ...CLAMP, easing: easings.gentle });
  const reveal = interpolate(presentationProgress, [0.5, 1], [0, 1], { ...CLAMP, easing: easings.gentle });
  const circle = (radius: number) => `circle(${Math.max(radius, 0)}px at ${cx}px ${cy}px)`;
  const ringColor = passedProps.ringColor ?? theme.colors.highlight;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: ringColor, clipPath: circle(reach * cover) }} />
      <AbsoluteFill
        style={{ background: passedProps.color ?? theme.colors.accent, clipPath: circle(reach * cover - ring) }}
      />
      <AbsoluteFill style={{ background: ringColor, clipPath: circle(reach * reveal) }} />
      <AbsoluteFill style={{ clipPath: circle(reach * reveal - ring), opacity: presentationProgress >= 0.5 ? 1 : 0 }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function circleBurst(props: CircleBurstProps = {}): TransitionPresentation<CircleBurstProps> {
  return { component: CircleBurstPresentation, props };
}
