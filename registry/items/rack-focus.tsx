/**
 * @title Rack Focus
 * @category transitions
 * @description The outgoing scene blurs and blows out as the incoming one sharpens into focus, like a lens racking focus between two subjects.
 * @duration 20
 * @use A premium, film-shot feel between two scenes at the same physical distance
 * @use Interview or talking-head cuts that should feel handled, not switched
 * @tags focus, blur, brightness, lens, cross-blur
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Subject />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={rackFocus()} timing={linearTiming({ durationInFrames: 20 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <OtherSubject />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useViewport } from "./core";

export type RackFocusProps = {
  /** Peak blur in design units for the scene going out of focus. */
  blurPeak?: number;
};

function RackFocusPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<RackFocusProps>) {
  const { u } = useViewport();
  const blurPeak = passedProps.blurPeak ?? 16;
  const exiting = presentationDirection === "exiting";
  const at = (from: number, to: number) =>
    interpolate(presentationProgress, [0, 1], [from, to], { ...CLAMP, easing: easings.gentle });
  const scale = exiting ? at(1, 1.05) : at(0.97, 1);
  const blur = exiting ? at(0, blurPeak) : at(blurPeak, 0);
  const brightness = exiting ? at(1, 1.3) : at(1.25, 1);
  // The exiting layer stays fully opaque and blurs/brightens away; the entering layer fades in on top
  // over the same window while it unblurs, so both are genuinely visible mid-transition — a real
  // cross-blur, not the entering layer's opaque `<AbsoluteFill>` fully occluding the exiting one from
  // frame 1 (TransitionSeries paints the entering side on top by default — confirmed by `card-push.tsx`'s
  // exiting branch explicitly setting `zIndex: 1` to override that same default). `zIndex` is set here
  // too, explicitly, rather than relying on the unstated default.
  const opacity = exiting ? 1 : at(0, 1);

  return (
    <AbsoluteFill
      style={{
        zIndex: exiting ? 0 : 1,
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${u(blur)}px) brightness(${brightness})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function rackFocus(props: RackFocusProps = {}): TransitionPresentation<RackFocusProps> {
  return { component: RackFocusPresentation, props };
}
