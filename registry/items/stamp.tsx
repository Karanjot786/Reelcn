/**
 * @title Stamp
 * @category text
 * @description A line that lands in one hit with a springy scale and a tilt that straightens as it settles.
 * @duration 30
 * @use Verdicts and labels such as sold out, approved or new
 * @use One- or two-word punchlines
 * @avoid Headlines longer than a few words — use `pop-in`
 * @tags stamp, slam, bounce, label, punchline
 * @preset text-reveal
 * @example
 * <Center>
 *   <Stamp text="Sold out" size={170} />
 * </Center>
 */
import { useMotion } from "./core";
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type StampProps = Omit<TextRevealProps, "effect" | "motion">;

export function Stamp({ style, ...props }: StampProps) {
  const m = useMotion({ delay: props.delay, duration: props.duration, motion: "bouncy" });
  return (
    <TextReveal
      split="line"
      {...props}
      effect="scale"
      motion="bouncy"
      style={{ rotate: `${(1 - m.enter) * -8}deg`, ...style }}
    />
  );
}
