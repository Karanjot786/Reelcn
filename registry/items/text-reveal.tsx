/**
 * @title Text Reveal
 * @category text
 * @description Headline that animates in by word, character or line with rise, blur, fade, scale, drop or mask effects.
 * @duration 30
 * @use Hero headlines, section titles and short-form hooks
 * @use Any line of up to about twelve words that needs an entrance
 * @tags headline, title, kinetic, stagger
 * @example
 * <Center>
 *   <TextReveal text="Ship videos, not keyframes" effect="blur" accentWords={["videos"]} />
 * </Center>
 */
import type React from "react";
import {
  alpha,
  graphemes,
  type MotionProps,
  tween,
  useMotion,
  useTheme,
  useVariableFontAxis,
  useViewport,
} from "./core";

export type TextRevealEffect =
  | "rise"
  | "blur"
  | "fade"
  | "scale"
  | "drop"
  | "mask"
  | "track"
  | "outline-fill"
  | "split-flap"
  | "variable-axis";

export type TextRevealProps = MotionProps & {
  text: string;
  effect?: TextRevealEffect;
  /** What staggers in. `line` splits on "\n". */
  split?: "word" | "char" | "line";
  /** Frames between units. Defaults at 30fps: char 1, word 2, line 5. */
  stagger?: number;
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  accentColor?: string;
  /** Words painted in the accent color. Case and punctuation are ignored. */
  accentWords?: string[];
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
};

const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const SPLIT_FLAP_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-".split("");

/** Cycles a character through a small fixed set of intermediate glyphs before settling on `target`,
 * seeded from the unit's own index (deterministic, not `Math.random`) — an airport-departures-board feel. */
function splitFlapChar(target: string, progress: number, seed: number): string {
  if (progress >= 1) return target;
  const targetIndex = SPLIT_FLAP_GLYPHS.indexOf(target.toUpperCase());
  if (targetIndex < 0) return target;
  const cycle = Math.floor((1 - progress) * 6) + (seed % 3);
  const index = (targetIndex + cycle) % SPLIT_FLAP_GLYPHS.length;
  return SPLIT_FLAP_GLYPHS[index];
}

function unitStyle(effect: TextRevealEffect, progress: number, fontPx: number): React.CSSProperties {
  const opacity = Math.min(Math.max(progress, 0), 1);
  const hidden = 1 - progress;
  switch (effect) {
    case "rise":
      return { opacity, translate: `0 ${hidden * 0.45}em` };
    case "blur":
      return { opacity, filter: `blur(${Math.max(hidden, 0) * fontPx * 0.12}px)`, translate: `0 ${hidden * 0.15}em` };
    case "fade":
      return { opacity };
    case "scale":
      return { opacity, scale: String(0.5 + 0.5 * progress) };
    case "drop":
      return { opacity, translate: `0 ${-hidden * 0.6}em`, rotate: `${-hidden * 8}deg` };
    case "mask":
      return { translate: `0 ${hidden * 110}%` };
    case "track":
      return { opacity, letterSpacing: `${hidden * 0.5}em` };
    case "outline-fill": {
      // `color: transparent` also zeroed out `currentColor` for the stroke on this same element (it's
      // the same property `currentColor` resolves against), so the stroke was invisible for the entire
      // outline phase and the fill then snapped in at 0.92 with nothing having been visible before it.
      // `-webkit-text-fill-color` controls the glyph fill paint without touching `color`, so `currentColor`
      // stays the real, opaque color for the stroke throughout. `progress` is the shared eased clock
      // (the `smooth` motion preset, front-loaded: it clears ~0.9 within the entrance's first third and
      // spends the rest creeping to 1), so thresholds here are placed to read well against *that* shape,
      // not against a linear clock: opacity ramps in over the first 15% of progress (a blink in real
      // time — no blank flash), a stroke-only outline then holds clearly visible while progress crosses
      // its mid-range, and the fill phases in — stroke shrinking as it does — only over progress's long
      // final approach to 1, which is most of the entrance's real duration.
      const p = Math.min(Math.max(progress, 0), 1);
      const strokeIn = Math.min(1, p / 0.15);
      const fillProgress = Math.max(0, (p - 0.85) / 0.15);
      return {
        opacity: strokeIn,
        WebkitTextFillColor: alpha("currentColor", fillProgress),
        WebkitTextStroke: `${(1 - fillProgress) * strokeIn * fontPx * 0.05}px currentColor`,
      };
    }
    case "split-flap":
      return { opacity: 1 };
    case "variable-axis":
      return { opacity, fontVariationSettings: `"wdth" ${(140 + (100 - 140) * progress).toFixed(2)}` };
  }
}

export function TextReveal({
  text,
  effect = "rise",
  split = "word",
  stagger,
  size = 96,
  weight,
  font = "heading",
  color,
  accentColor,
  accentWords = [],
  align = "center",
  style,
  className,
  ...motion
}: TextRevealProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  // variable-axis falls back to fade on any theme with no variable font loaded, so it never throws on
  // daylight/midnight/paper/sunset/neon — only mono has the Archivo variable cut this effect animates.
  const effectiveEffect = effect === "variable-axis" && theme.name !== "mono" ? "fade" : effect;
  // mono/Signal's signature move: Archivo's wdth axis snaps from expanded to condensed as the
  // headline enters. Always computed (cheap, pure math) so this hook is never called conditionally;
  // only applied to the style below when the theme and font slot actually use the variable cut.
  const axisSettings = useVariableFontAxis(125, 62, {
    fps: m.fps,
    frame: m.frame,
    motion: motion.motion ?? theme.motion,
    delay: m.delay,
    duration: m.enterFrames,
  });
  const fontPx = u(size);
  const step = stagger ?? (split === "char" ? 1 : Math.round(m.fps * (split === "word" ? 0.07 : 0.16)));
  const accents = new Set(accentWords.map(normalize));
  let unitIndex = 0;

  const renderUnit = (content: string, key: number, index: number) => {
    const progress = tween(m.frame, m.fps, {
      from: m.delay + index * step,
      duration: m.enterFrames,
      motion: m.preset,
    });
    const displayContent = effectiveEffect === "split-flap" ? splitFlapChar(content, progress, index) : content;
    const inner = (
      <span
        key={key}
        style={{ display: "inline-block", whiteSpace: "pre", ...unitStyle(effectiveEffect, progress, fontPx) }}
      >
        {displayContent}
      </span>
    );
    if (effect !== "mask") return inner;
    // A mask needs a clipping wrapper; the padding keeps descenders from being cut.
    return (
      <span
        key={key}
        style={{
          display: "inline-block",
          overflow: "hidden",
          verticalAlign: "top",
          paddingBottom: "0.12em",
          marginBottom: "-0.12em",
        }}
      >
        {inner}
      </span>
    );
  };

  const lines = text.split("\n").map((line, lineNumber) => {
    const lineIndex = unitIndex;
    if (split === "line") unitIndex++;
    const parts = line.split(/(\s+)/).map((word, wordNumber) => {
      // Whitespace stays a plain text node so the browser can still wrap the line.
      if (!word || /^\s+$/.test(word)) return word;
      const accent = accents.has(normalize(word)) ? { color: accentColor ?? theme.colors.accent } : undefined;
      if (split === "char") {
        return (
          <span key={wordNumber} style={{ display: "inline-block", whiteSpace: "nowrap", ...accent }}>
            {graphemes(word).map((char, charNumber) => renderUnit(char, charNumber, unitIndex++))}
          </span>
        );
      }
      // `line` stagger animates the whole line as one rigid unit below, so words here stay plain.
      if (split === "line")
        return accent ? (
          <span key={wordNumber} style={accent}>
            {word}
          </span>
        ) : (
          word
        );
      return (
        <span key={wordNumber} style={accent}>
          {renderUnit(word, wordNumber, unitIndex++)}
        </span>
      );
    });
    if (split !== "line") return <div key={lineNumber}>{parts}</div>;
    const progress = tween(m.frame, m.fps, {
      from: m.delay + lineIndex * step,
      duration: m.enterFrames,
      motion: m.preset,
    });
    return (
      <div
        key={lineNumber}
        style={effect === "mask" ? { overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" } : undefined}
      >
        <span style={{ display: "inline-block", ...unitStyle(effectiveEffect, progress, fontPx) }}>{parts}</span>
      </div>
    );
  });

  return (
    <div
      className={className}
      style={{
        fontFamily: theme.fonts[font],
        fontSize: fontPx,
        fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
        color: color ?? theme.colors.foreground,
        lineHeight: 1.1,
        letterSpacing: font === "mono" ? 0 : "-0.025em",
        fontVariationSettings: theme.name === "mono" && font === "heading" ? axisSettings : undefined,
        textAlign: align,
        textWrap: "balance",
        maxWidth: width - safe.x * 2,
        opacity: 1 - m.exit,
        translate: `0 ${-m.exit * fontPx * 0.2}px`,
        ...style,
      }}
    >
      {lines}
    </div>
  );
}
