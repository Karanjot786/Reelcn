/**
 * @title Slice Slide
 * @category transitions
 * @description Cuts the frame into horizontal slices that slide out alternately left and right, each pushed out by the matching slice of the next scene.
 * @duration 30
 * @use Stylised scene changes in promos, music and fashion edits
 * @use Swapping between two layouts with a strong horizontal rhythm
 * @avoid Scenes that play audio or video, since both render once per slice — use `brand-sweep`
 * @tags slices, strips, push, stagger
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <LookOne />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={sliceSlide({ slices: 6 })} timing={linearTiming({ durationInFrames: 30 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <LookTwo />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useViewport } from "./core";

export type SliceSlideProps = {
  /** Number of horizontal slices. Defaults to one per 216 design units of height. */
  slices?: number;
  /** Where the top slice leaves to. The slices below alternate. */
  direction?: "left" | "right";
};

function SliceSlidePresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<SliceSlideProps>) {
  const { width, height, u } = useViewport();
  const count = Math.max(2, Math.round(passedProps.slices ?? height / u(216)));
  const first = passedProps.direction === "right" ? 1 : -1;
  const entering = presentationDirection === "entering";
  // Slices start one after another from the top; the last one still gets 70% of the transition to travel.
  const step = 0.3 / (count - 1);
  const span = 1 - step * (count - 1);

  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, index) => {
        const top = Math.round((index * height) / count);
        const bottom = Math.round(((index + 1) * height) / count);
        const sign = index % 2 === 0 ? first : -first;
        const travel = interpolate(presentationProgress, [index * step, index * step + span], [0, 1], {
          ...CLAMP,
          easing: easings.gentle,
        });
        // Outgoing slices leave toward `sign`; incoming slices follow them in from the opposite edge.
        const x = sign * (entering ? travel - 1 : travel) * width;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: 0,
              top,
              width,
              height: bottom - top,
              overflow: "hidden",
              translate: `${x}px 0`,
            }}
          >
            <div style={{ position: "absolute", left: 0, top: -top, width, height }}>{children}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function sliceSlide(props: SliceSlideProps = {}): TransitionPresentation<SliceSlideProps> {
  return { component: SliceSlidePresentation, props };
}
