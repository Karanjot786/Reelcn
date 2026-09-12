/**
 * @title Stripe Wipe
 * @category transitions
 * @description A band of tapered diagonal stripes sweeps across the frame, wiping the next scene in behind it.
 * @duration 24
 * @use Energetic scene changes in sports, promo and social edits
 * @use Wipes that should carry the brand color
 * @tags wipe, stripes, diagonal, speed
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Score />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={stripeWipe({ stripes: 6 })} timing={linearTiming({ durationInFrames: 24 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <Highlights />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { CLAMP, easings, useTheme, useViewport } from "./core";

export type StripeWipeProps = {
  /** Stripe colors, cycled from the wipe edge forward. Defaults to the theme accent. */
  colors?: string[];
  /** Number of stripes in the band. */
  stripes?: number;
  /** Which way the wipe travels. */
  direction?: "right" | "left";
  /** Lean of the stripes in degrees. */
  angle?: number;
};

function StripeWipePresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<StripeWipeProps>) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;

  const colors = passedProps.colors ?? [theme.colors.accent];
  const count = Math.max(1, Math.round(passedProps.stripes ?? 5));
  const flip = passedProps.direction === "left";
  const lean = (height / 2) * Math.tan(((passedProps.angle ?? 24) * Math.PI) / 180);
  // Stripes taper away from the wipe edge; the first one sits on the edge and hides it.
  const stripes: { offset: number; size: number }[] = [];
  let band = 0;
  for (let index = 0; index < count; index++) {
    const size = (u(84) * (count - index)) / count;
    stripes.push({ offset: band, size });
    band += size * 1.5;
  }
  const edge =
    -(band + lean) +
    (width + band + 2 * lean) * interpolate(presentationProgress, [0, 1], [0, 1], { ...CLAMP, easing: easings.gentle });
  const x = (value: number) => (flip ? width - value : value);
  const slant = (from: number, to: number) =>
    `polygon(${x(from + lean)}px 0, ${x(to + lean)}px 0, ${x(to - lean)}px ${height}px, ${x(from - lean)}px ${height}px)`;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: slant(-width - 2 * lean, edge) }}>{children}</AbsoluteFill>
      {stripes.map((stripe, index) => (
        <AbsoluteFill
          key={index}
          style={{
            background: colors[index % colors.length],
            clipPath: slant(edge + stripe.offset, edge + stripe.offset + stripe.size),
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

export function stripeWipe(props: StripeWipeProps = {}): TransitionPresentation<StripeWipeProps> {
  return { component: StripeWipePresentation, props };
}
