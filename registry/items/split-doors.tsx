/**
 * @title Split Doors
 * @category transitions
 * @description The outgoing scene splits down the middle and its two halves slide apart like doors, revealing the next scene.
 * @duration 24
 * @use Revealing a product shot, logo or new chapter behind the current scene
 * @use Moving from a title card into the main content
 * @avoid An outgoing scene that plays audio or video, since it renders once per door — use `circle-burst`
 * @tags doors, split, open, reveal
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <TitleCard />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={splitDoors()} timing={linearTiming({ durationInFrames: 24 })} />
 *   <TransitionSeries.Sequence durationInFrames={90}>
 *     <ProductShot />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { alpha, CLAMP, easings, useViewport } from "./core";

export type SplitDoorsProps = {
  /** Which way the doors travel. Defaults to `horizontal` in landscape and square, `vertical` in portrait. */
  direction?: "horizontal" | "vertical";
  /** Shadow the doors cast on the revealed scene. */
  shadowColor?: string;
};

function SplitDoorsPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<SplitDoorsProps>) {
  const { width, height, isPortrait, u } = useViewport();
  const horizontal = (passedProps.direction ?? (isPortrait ? "vertical" : "horizontal")) === "horizontal";
  const open = interpolate(presentationProgress, [0, 1], [0, 1], { ...CLAMP, easing: easings.gentle });

  if (presentationDirection === "entering") {
    // The incoming scene shows through the widening gap, shaded at the door edges and settling from a slight zoom.
    const gap = (1 - open) * 50;
    const shadow = passedProps.shadowColor ?? alpha("#000000", 0.5);
    const fade = u(120);
    return (
      <AbsoluteFill style={{ clipPath: horizontal ? `inset(0 ${gap}%)` : `inset(${gap}% 0)` }}>
        <AbsoluteFill style={{ scale: String(1.08 - 0.08 * open) }}>{children}</AbsoluteFill>
        <AbsoluteFill
          style={{
            opacity: 1 - open,
            background: `linear-gradient(${horizontal ? "90deg" : "180deg"}, ${shadow} ${gap}%, transparent calc(${gap}% + ${fade}px), transparent calc(${100 - gap}% - ${fade}px), ${shadow} ${100 - gap}%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // The outgoing scene is drawn once per door; each door shows its half and travels its own size off-screen.
  return (
    <AbsoluteFill>
      {[0, 1].map((door) => {
        const sign = door === 0 ? -1 : 1;
        return (
          <div
            key={door}
            style={{
              position: "absolute",
              overflow: "hidden",
              left: horizontal ? (door * width) / 2 : 0,
              top: horizontal ? 0 : (door * height) / 2,
              width: horizontal ? width / 2 : width,
              height: horizontal ? height : height / 2,
              translate: horizontal ? `${sign * open * 100}% 0` : `0 ${sign * open * 100}%`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: horizontal ? (-door * width) / 2 : 0,
                top: horizontal ? 0 : (-door * height) / 2,
                width,
                height,
              }}
            >
              {children}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function splitDoors(props: SplitDoorsProps = {}): TransitionPresentation<SplitDoorsProps> {
  return { component: SplitDoorsPresentation, props };
}
