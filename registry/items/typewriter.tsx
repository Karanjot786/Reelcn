/**
 * @title Typewriter
 * @category text
 * @description Types text out character by character, with pause markers and a caret that blinks once typing stops.
 * @duration data-driven
 * @use Prompts, search queries and chat-style reveals
 * @use Quotes and statements that should read at speaking pace
 * @avoid Code listings — use `code-block`
 * @avoid Shell commands with output — use `terminal`
 * @tags typing, caret, cursor, prompt, type on
 * @example
 * <Center>
 *   <Typewriter text="Make a launch video^ for vertical" cps={20} />
 * </Center>
 */
import type React from "react";
import {
  type CaretFollow,
  FollowCaret,
  graphemes,
  type MotionProps,
  useMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type TypewriterProps = MotionProps & {
  /** Text to type. `^` pauses for `pause` frames, `^20` pauses for 20 frames, `\n` starts a new line. */
  text: string;
  /** Characters per second. A `duration` wins over it and becomes the total typing time in frames. */
  cps?: number;
  /** Total typing time in frames. Wins over `duration` and `cps` when set. */
  typingFrames?: number;
  /** Frames a bare `^` waits. Defaults to 0.5s. */
  pause?: number;
  caret?: "bar" | "block" | "none";
  /** Font size in design units. */
  size?: number;
  weight?: number;
  font?: "heading" | "body" | "mono";
  color?: string;
  /** Caret color. Defaults to the theme accent. */
  caretColor?: string;
  align?: "left" | "center" | "right";
  /** Zooms the camera to trail the caret as it types. Omitted (default): today's behavior, unchanged. */
  follow?: CaretFollow;
  style?: React.CSSProperties;
  className?: string;
};

/** The characters to type, and for each one the extra frames to wait before it appears. */
function parse(text: string, pause: number) {
  const chars: string[] = [];
  const waits: number[] = [];
  let wait = 0;
  text.split(/\^(\d*)/).forEach((part, index) => {
    // split() with a capture group alternates text, marker digits, text, marker digits…
    if (index % 2 === 1) {
      wait += part === "" ? pause : Number(part);
      return;
    }
    for (const char of graphemes(part)) {
      chars.push(char);
      waits.push(wait);
      wait = 0;
    }
  });
  return { chars, waits };
}

export function Typewriter({
  text,
  cps = 18,
  typingFrames,
  pause,
  caret = "bar",
  size = 72,
  weight,
  font = "heading",
  color,
  caretColor,
  align = "center",
  follow,
  style,
  className,
  ...motion
}: TypewriterProps) {
  const theme = useTheme();
  const { u, width, safe } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  const { chars, waits } = parse(text, pause ?? Math.round(m.fps * 0.5));
  const totalFrames = typingFrames ?? motion.duration;
  const perChar = totalFrames ? totalFrames / Math.max(chars.length, 1) : m.fps / cps;

  let typed = 0;
  let end = m.delay;
  for (let i = 0; i < chars.length; i++) {
    end += waits[i] + perChar;
    if (m.frame >= end) typed = i + 1;
  }
  // Solid while typing, then a hard on/off blink once a second, like a real text cursor.
  const typing = m.frame >= m.delay && m.frame < end;
  const caretOn = typing || Math.floor(Math.abs(m.frame - end) / Math.max(1, Math.round(m.fps / 2))) % 2 === 0;
  const block = caret === "block";

  // Follow: the caret position `lag` frames ago, from the same reveal logic above evaluated at an
  // earlier frame — always computed (cheap, pure), only measured/used when `follow` is set.
  const laggedFrame = Math.max(m.frame - (follow?.lag ?? 6), m.delay);
  let laggedTyped = 0;
  let laggedEnd = m.delay;
  for (let i = 0; i < chars.length; i++) {
    laggedEnd += waits[i] + perChar;
    if (laggedFrame >= laggedEnd) laggedTyped = i + 1;
  }
  const laggedText = chars.slice(0, laggedTyped).join("");
  const caretMetrics = useTextMetrics(laggedText, {
    fontFamily: theme.fonts[font],
    fontSize: fontPx,
    fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
  });
  const laggedLines = laggedText.split("\n").length - 1;
  const caretPosition = { x: caretMetrics.width, y: laggedLines * fontPx * 1.2 };

  return (
    <FollowCaret follow={follow} caret={caretPosition}>
      <div
        className={className}
        style={{
          fontFamily: theme.fonts[font],
          fontSize: fontPx,
          fontWeight: weight ?? (font === "heading" ? theme.headingWeight : 500),
          color: color ?? theme.colors.foreground,
          lineHeight: 1.2,
          letterSpacing: font === "mono" ? 0 : "-0.02em",
          textAlign: align,
          textWrap: "balance",
          whiteSpace: "pre-wrap",
          maxWidth: width - safe.x * 2,
          opacity: 1 - m.exit,
          translate: `0 ${-m.exit * fontPx * 0.2}px`,
          ...style,
        }}
      >
        {chars.slice(0, typed).join("")}
        {caret !== "none" && (
          // An empty inline span marks the insertion point without adding a line-break opportunity.
          <span style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: block ? 0 : "0.02em",
                top: "0.08em",
                bottom: "0.08em",
                width: block ? "0.56em" : "0.07em",
                background: caretColor ?? theme.colors.accent,
                opacity: caretOn ? (block ? 0.75 : 1) : 0,
              }}
            />
          </span>
        )}
        {/* The untyped rest keeps its space, so wrapping and centering never shift while typing. */}
        <span style={{ visibility: "hidden" }}>{chars.slice(typed).join("")}</span>
      </div>
    </FollowCaret>
  );
}
