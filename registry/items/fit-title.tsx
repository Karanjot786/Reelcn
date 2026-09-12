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
/// <reference lib="dom" />
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { graphemes, useTheme, useViewport } from "./core";
import { TextReveal, type TextRevealProps } from "./text-reveal";

export type FitTitleProps = Omit<TextRevealProps, "size" | "split"> & {
  /** Largest font size in design units, reached when the text is short. */
  maxSize?: number;
  /** Width to fill, in design units. Defaults to the safe-zone width. */
  maxWidth?: number;
  split?: "word" | "char";
};

let context: CanvasRenderingContext2D | null = null;

/** Width of `text` in px for a CSS `font` shorthand. */
function measure(text: string, font: string) {
  if (!context) context = document.createElement("canvas").getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
}

/**
 * True once the first family of a font stack has a face covering this weight in `document.fonts`.
 * `@remotion/google-fonts` adds a face only after it has loaded, so `document.fonts.ready` alone can resolve too early.
 */
function hasFace(stack: string, weight: number) {
  const family = stack.split(",")[0].trim().replace(/["']/g, "");
  let found = false;
  document.fonts.forEach((face) => {
    const range = face.weight.split(" ");
    const covers = Number(range[0]) <= weight && weight <= Number(range[range.length - 1]);
    if (covers && face.family.replace(/["']/g, "") === family) found = true;
  });
  return found;
}

export function FitTitle({ text, maxSize = 240, maxWidth, font = "heading", weight, style, ...props }: FitTitleProps) {
  const theme = useTheme();
  const { u, scale, width, safe } = useViewport();
  const [handle] = useState(() => delayRender("fit-title fonts"));
  const [ready, setReady] = useState(false);
  const stack = theme.fonts[font];
  const fontWeight = weight ?? (font === "heading" ? theme.headingWeight : 500);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    // A system font never shows up as a face: after two seconds, measure with whatever is there.
    const check = () => {
      if (cancelled) return;
      if (hasFace(stack, fontWeight) || ++attempts > 40) setReady(true);
      else setTimeout(check, 50);
    };
    document.fonts.ready.then(check);
    return () => {
      cancelled = true;
    };
  }, [stack, fontWeight]);

  // Release the frame only after the measured size has been committed.
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  const available = maxWidth === undefined ? width - safe.x * 2 : u(maxWidth);
  // Matches TextReveal's tracking: -0.025em, none for mono.
  const tracking = font === "mono" ? 0 : -0.025;
  const perPx = ready ? measure(text, `${fontWeight} 100px ${stack}`) / 100 + graphemes(text).length * tracking : 0;
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
