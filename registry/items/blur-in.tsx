/**
 * @title Blur In
 * @category text
 * @description Headline whose words fade up out of a soft blur, one after another.
 * @duration 30
 * @use Calm, premium intros and brand statements
 * @use Titles laid over footage or gradients
 * @avoid Punchy, high-energy hooks — use `pop-in`
 * @tags blur, focus, soft, headline
 * @preset text-reveal
 * @example
 * <Center>
 *   <BlurIn text="Quietly, then all at once" />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type BlurInProps = Omit<TextRevealProps, "effect">;

export function BlurIn(props: BlurInProps) {
  return <TextReveal {...props} effect="blur" />;
}
