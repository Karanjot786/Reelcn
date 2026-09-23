/**
 * @title Card Push
 * @category transitions
 * @description The outgoing scene shrinks into a rounded card and flies off while the next scene rises from behind as a card and expands to full frame.
 * @duration 30
 * @use Stepping through screens, slides or features like a deck of cards
 * @use Product walkthroughs and app demos
 * @tags card, deck, push, stack
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={90}>
 *     <FeatureOne />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={cardPush({ direction: "left" })} timing={linearTiming({ durationInFrames: 30 })} />
 *   <TransitionSeries.Sequence durationInFrames={90}>
 *     <FeatureTwo />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { alpha, CLAMP, easings, useTheme, useViewport } from "./core";

/** On-screen morphs and the fly-off: ease-in-out, finite velocity at both ends (no one-frame jump). */
const inOut = Easing.inOut(Easing.cubic);

export type CardPushProps = {
  /** Where the outgoing card leaves to. The incoming card rises from the opposite side. */
  direction?: "up" | "down" | "left" | "right";
  /** Degrees the outgoing card tilts as it leaves. */
  tilt?: number;
  /** Canvas behind the cards. Defaults to a tone between the theme background and foreground. */
  backdrop?: string;
  /** Card outline. Defaults to the theme border. */
  borderColor?: string;
};

/** Scale at which a scene reads as a card. */
const CARD = 0.8;

function CardPushPresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<CardPushProps>) {
  const theme = useTheme();
  const { u } = useViewport();
  const direction = passedProps.direction ?? "up";
  const vertical = direction === "up" || direction === "down";
  const sign = direction === "up" || direction === "left" ? -1 : 1;
  const radius = u(theme.radius * 1.6);
  const outline = passedProps.borderColor ?? theme.colors.border;
  const at = (start: number, end: number, easing: (t: number) => number) =>
    interpolate(presentationProgress, [start, end], [0, 1], { ...CLAMP, easing });
  const move = (percent: number) => (vertical ? `0 ${percent}%` : `${percent}% 0`);
  // Rounded corners, hairline and shadow, faded in by `amount`.
  const card = (amount: number): React.CSSProperties => ({
    overflow: "hidden",
    borderRadius: radius * amount,
    outline: `1px solid ${alpha(outline, amount)}`,
    boxShadow: `0 ${u(30)}px ${u(90)}px ${alpha("#000000", 0.4 * amount)}`,
  });

  if (presentationDirection === "exiting") {
    const shrink = at(0, 0.45, inOut);
    const leave = at(0.3, 0.9, inOut);
    // zIndex lifts the outgoing card above the incoming scene, so the next card waits behind it.
    return (
      <AbsoluteFill style={{ zIndex: 1 }}>
        <AbsoluteFill
          style={{
            ...card(shrink),
            scale: String(1 - (1 - CARD) * shrink),
            translate: move(sign * leave * 115),
            rotate: `${sign * (passedProps.tilt ?? 6) * leave}deg`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const rise = at(0.2, 0.75, easings.smooth);
  const grow = at(0.55, 1, inOut);
  const backdrop =
    passedProps.backdrop ?? `color-mix(in srgb, ${theme.colors.foreground} 14%, ${theme.colors.background})`;
  return (
    <AbsoluteFill style={{ background: grow < 1 ? backdrop : undefined }}>
      <AbsoluteFill
        style={{
          ...card(1 - grow),
          scale: String(CARD - 0.08 * (1 - rise) + (1 - CARD) * grow),
          translate: move(-sign * (1 - rise) * 14),
        }}
      >
        {children}
        <AbsoluteFill style={{ background: "#000000", opacity: 0.45 * (1 - rise) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function cardPush(props: CardPushProps = {}): TransitionPresentation<CardPushProps> {
  return { component: CardPushPresentation, props };
}
