/**
 * @title Line Slide
 * @category text
 * @description Multi-line statement where each line slides up from behind a mask, one line after another.
 * @duration 30
 * @use Two- or three-line statements, with lines separated by "\n"
 * @use Manifesto-style sequences and closing statements
 * @avoid A single word or name — use `char-rise`
 * @tags lines, mask, slide, statement, stagger
 * @preset text-reveal
 * @example
 * <Center>
 *   <LineSlide text={"Write the script.\nRender the story."} align="left" />
 * </Center>
 */
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type LineSlideProps = Omit<TextRevealProps, "effect" | "split">;

export function LineSlide(props: LineSlideProps) {
  return <TextReveal {...props} split="line" effect="mask" />;
}
