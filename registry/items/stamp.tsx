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

export type StampProps = Omit<TextRevealProps, "effect">;

export function Stamp({ style, motion, ...props }: StampProps) {
  const m = useMotion({ delay: props.delay, duration: props.duration, motion: motion ?? "bouncy" });
  // A short thud as it lands: three frames of shrinking jitter.
  const landed = m.frame - m.delay - Math.round(m.enterFrames * 0.35);
  const shake = landed >= 0 && landed < 3 ? [0.03, -0.02, 0.01][landed] : 0;
  return (
    <TextReveal
      split="line"
      scaleFrom={1.6}
      {...props}
      effect="scale"
      motion={motion ?? "bouncy"}
      style={{
        rotate: `${(1 - m.enter) * -8}deg`,
        // transform, not translate: TextReveal's exit lift owns `translate`.
        transform: `translate(${shake}em, ${-shake}em)`,
        filter: "drop-shadow(0 0.05em 0.02em rgba(0, 0, 0, 0.22))",
        ...style,
      }}
    />
  );
}
