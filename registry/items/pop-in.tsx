/**
 * @title Pop In
 * @category text
 * @description Headline whose words scale up with a springy overshoot.
 * @duration 30
 * @use Energetic hooks, sales and launch callouts
 * @use Short labels that should feel lively
 * @avoid Calm or premium tone — use `blur-in`
 * @tags pop, bounce, spring, scale, energetic
 * @preset text-reveal
 * @example
 * <Center>
 *   <PopIn text="Now in beta" size={130} />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type PopInProps = Omit<TextRevealProps, "effect" | "motion">;

export function PopIn(props: PopInProps) {
  return <TextReveal {...props} effect="scale" motion="bouncy" />;
}
