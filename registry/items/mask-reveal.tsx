/**
 * @title Mask Reveal
 * @category text
 * @description Headline whose words slide up from behind an invisible edge, as if uncovered by a mask.
 * @duration 30
 * @use Editorial and cinematic titles
 * @use Crisp reveals where fading would feel soft
 * @avoid Multi-line statements that should arrive line by line — use `line-slide`
 * @tags mask, clip, reveal, editorial, headline
 * @preset text-reveal
 * @example
 * <Center>
 *   <MaskReveal text="Made for vertical first" />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type MaskRevealProps = Omit<TextRevealProps, "effect">;

export function MaskReveal(props: MaskRevealProps) {
  return <TextReveal {...props} effect="mask" />;
}
