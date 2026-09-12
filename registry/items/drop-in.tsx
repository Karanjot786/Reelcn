/**
 * @title Drop In
 * @category text
 * @description Headline whose words drop in from above with a slight tilt that settles.
 * @duration 30
 * @use Playful announcements, drops and release titles
 * @use Friendly, casual brands
 * @avoid Serious or premium tone — use `blur-in`
 * @tags drop, fall, playful, headline
 * @preset text-reveal
 * @example
 * <Center>
 *   <DropIn text="Fresh drops every Friday" />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type DropInProps = Omit<TextRevealProps, "effect">;

export function DropIn(props: DropInProps) {
  return <TextReveal {...props} effect="drop" />;
}
