/**
 * @title Rise Up
 * @category text
 * @description Headline whose words rise into place from just below the line — an alias of `text-reveal` with `effect="rise"` and no other prop changes.
 * @duration 30
 * @use The default choice for clean, confident headlines
 * @use Section titles and short-form hooks
 * @avoid Letter-by-letter reveals of a single word — use `char-rise`
 * @tags rise, slide up, headline, clean
 * @preset text-reveal
 * @example
 * <Center>
 *   <RiseUp text="Every frame is code" accentWords={["code"]} />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type RiseUpProps = Omit<TextRevealProps, "effect">;

export function RiseUp(props: RiseUpProps) {
  return <TextReveal {...props} effect="rise" />;
}
