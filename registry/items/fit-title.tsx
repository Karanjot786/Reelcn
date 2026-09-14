/**
 * @title Fit Title
 * @category text
 * @description One-line title that sizes itself to fill the available width, measured with the real font once it has loaded.
 * @duration 30
 * @use Big one-word or short titles that should fill the frame at every aspect ratio
 * @use Titles of unknown length, such as data-driven names or chapter titles
 * @avoid Headlines that should wrap onto several lines — use `text-reveal`
 * @tags fit, auto size, responsive, title, big type
 * @example
 * <Center>
 *   <FitTitle text="Season finale" effect="mask" />
 * </Center>
 */
import { graphemes, useTextMetrics, useTheme, useViewport } from "./core";
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type FitTitleProps = Omit<TextRevealProps, "size" | "split"> & {
  /** Largest font size in design units, reached when the text is short. */
  maxSize?: number;
  /** Width to fill, in design units. Defaults to the safe-zone width. */
  maxWidth?: number;
  split?: "word" | "char";
};

export function FitTitle({ text, maxSize = 240, maxWidth, font = "heading", weight, style, ...props }: FitTitleProps) {
  const theme = useTheme();
  const { u, scale, width, safe } = useViewport();
  const stack = theme.fonts[font];
  const fontWeight = weight ?? (font === "heading" ? theme.headingWeight : 500);
  const metrics = useTextMetrics(text, { fontFamily: stack, fontSize: 100, fontWeight: fontWeight });
  const ready = metrics.ready;

  const available = maxWidth === undefined ? width - safe.x * 2 : u(maxWidth);
  // Matches TextReveal's tracking: -0.025em, none for mono.
  const tracking = font === "mono" ? 0 : -0.025;
  const perPx = ready ? metrics.width / 100 + graphemes(text).length * tracking : 0;
  // 2% headroom: each word or character is its own box, so kerning across boxes is lost and the line runs a bit wider.
  const px = perPx > 0 ? Math.min((available * 0.98) / perPx, u(maxSize)) : u(maxSize);

  return (
    <TextReveal
      {...props}
      text={text}
      font={font}
      weight={fontWeight}
      size={px / scale}
      style={{ whiteSpace: "nowrap", maxWidth: "none", visibility: ready ? undefined : "hidden", ...style }}
    />
  );
}
