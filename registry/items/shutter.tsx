/**
 * @title Shutter
 * @category transitions
 * @description Slats close one after another over the outgoing scene, then open in the same direction onto the next one.
 * @duration 30
 * @use Section changes in slideshows, listicles and countdowns
 * @use Editorial or retro looks that want a mechanical rhythm
 * @tags shutter, blinds, slats, stagger
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <NumberThree />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={shutter({ slats: 8 })} timing={linearTiming({ durationInFrames: 30 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <NumberTwo />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useTheme, useViewport } from "./core";

export type ShutterProps = {
  /** Number of slats. Defaults to one per 160 design units across the frame. */
  slats?: number;
  /** `horizontal` slats stack top to bottom; `vertical` slats stand side by side. */
  direction?: "horizontal" | "vertical";
  /** Slat color. Defaults to the theme accent. */
  color?: string;
};

function ShutterPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<ShutterProps>) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: presentationProgress < 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>;
  }

  const vertical = passedProps.direction === "vertical";
  // The length the slats are stacked along.
  const extent = vertical ? width : height;
  const count = Math.max(2, Math.round(passedProps.slats ?? extent / u(160)));
  // Every slat is shut from 0.48 to 0.52, which hides the cut.
  const step = 0.18 / (count - 1);
  const span = 0.48 - step * (count - 1);
  const color = passedProps.color ?? theme.colors.accent;
  const at = (start: number) =>
    interpolate(presentationProgress, [start, start + span], [0, 1], { ...CLAMP, easing: easings.gentle });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: presentationProgress >= 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      {Array.from({ length: count }, (_, index) => {
        // Whole pixels that overlap by up to one, so shut slats never show a hairline seam.
        const start = Math.floor((index * extent) / count);
        const size = Math.ceil(((index + 1) * extent) / count) - start;
        // A slat grows from its leading edge, then shrinks toward its trailing edge, so the motion keeps one direction.
        const close = at(index * step);
        const open = at(0.52 + index * step);
        const from = start + size * open;
        const length = size * (close - open);
        if (length <= 0) return null;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              background: color,
              ...(vertical
                ? { top: 0, bottom: 0, left: from, width: length }
                : { left: 0, right: 0, top: from, height: length }),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function shutter(props: ShutterProps = {}): TransitionPresentation<ShutterProps> {
  return { component: ShutterPresentation, props };
}
