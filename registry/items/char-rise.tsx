/**
 * @title Char Rise
 * @category text
 * @description A short word or name whose characters rise in one after another.
 * @duration 30
 * @use Single words, names and short brand lines
 * @use Big title cards with only a few letters
 * @avoid Sentences longer than a few words — use `rise-up`
 * @tags characters, letters, stagger, rise, title
 * @preset text-reveal
 * @example
 * <Center>
 *   <CharRise text="Launch day" size={150} />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type CharRiseProps = Omit<TextRevealProps, "effect" | "split">;

export function CharRise(props: CharRiseProps) {
  return <TextReveal {...props} split="char" effect="rise" />;
}
