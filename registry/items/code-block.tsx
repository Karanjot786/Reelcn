/**
 * @title Code Block
 * @category product
 * @description Themed editor card with syntax colors, line numbers and a file tab that can type code out, focus lines and mark a diff.
 * @duration data-driven
 * @use Showing an API, config file or snippet in a launch, docs or tutorial video
 * @use Typing code on screen, then focusing the lines that matter
 * @avoid Shell sessions with commands and output — use `terminal`
 * @tags code, editor, syntax, snippet, diff, typing
 * @example
 * <Center>
 *   <CodeBlock
 *     title="render.ts"
 *     language="ts"
 *     code={'const video = await render({\n  fps: 30,\n  codec: "h264",\n});'}
 *     typing={45}
 *     highlightLines={[3]}
 *   />
 * </Center>
 */
import type React from "react";
import { type CodeLanguage, type Token, type TokenKind, tokenColors, tokenize } from "./code-tokens";
import {
  alpha,
  type CaretFollow,
  FollowCaret,
  type MotionProps,
  tween,
  useMotion,
  useRoleMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type CodeBlockProps = MotionProps & {
  code: string;
  language?: CodeLanguage;
  /** File name shown in the tab. */
  title?: string;
  /** Types the code out at this many characters per second. Omit to show it all at once. */
  typing?: number;
  /** 1-based lines to focus: the rest dim and the focused lines get an accent band. */
  highlightLines?: number[];
  /** Frame the focus and diff bands sweep in. Defaults to just after the code is fully shown. */
  highlightAt?: number;
  /** 1-based lines marked as added or removed. */
  diff?: { add?: number[]; remove?: number[] };
  lineNumbers?: boolean;
  /** Largest font size in design units. It shrinks so the longest line and every row fit. */
  fontSize?: number;
  /** Largest card width as a fraction of the safe area (0–1). Defaults to 0.72 in landscape, 1 otherwise. */
  width?: number;
  /** Per-token colors. Defaults derive from the theme (see `tokenColors`). */
  colors?: Partial<Record<TokenKind, string>>;
  /** Editor background. Defaults to the theme surface. */
  background?: string;
  borderColor?: string;
  /** Added-line color. Defaults to green, because the theme has no status colors. */
  addColor?: string;
  /** Removed-line color. Defaults to red. */
  removeColor?: string;
  /** Corner radius in design units. Defaults to 70% of the theme radius. */
  radius?: number;
  /** Zooms the camera to trail the caret as it types. Omitted (default): today's behavior, unchanged. */
  follow?: CaretFollow;
  style?: React.CSSProperties;
  className?: string;
};

/** Advance width of one monospace glyph, in em. */
const CHAR = 0.6;
const LINE = 1.65;

/** The first `count` characters of a tokenized line. */
function sliceTokens(tokens: Token[], count: number): Token[] {
  const out: Token[] = [];
  let left = count;
  for (const token of tokens) {
    if (left <= 0) break;
    out.push(left >= token.text.length ? token : { text: token.text.slice(0, left), kind: token.kind });
    left -= token.text.length;
  }
  return out;
}

export function CodeBlock({
  code,
  language = "ts",
  title,
  typing,
  highlightLines = [],
  highlightAt,
  diff,
  lineNumbers = true,
  fontSize = 30,
  width: widthFraction,
  colors,
  background,
  borderColor,
  addColor,
  removeColor,
  radius,
  follow,
  style,
  className,
  ...motion
}: CodeBlockProps) {
  const theme = useTheme();
  const add = addColor ?? theme.colors.success;
  const remove = removeColor ?? theme.colors.danger;
  const { u, width, height, safe, isLandscape } = useViewport();
  const m = useMotion(motion);
  // opacityLeadFrames: 0 keeps this item's default render pixel-identical to its pre-retrofit hardcoded
  // exit (opacity and geometry finishing together); useRoleMotion's own default (3) is unchanged for other adopters.
  const role = useRoleMotion(m, { exit: { opacityLeadFrames: 0 } });
  const palette = { ...tokenColors(theme.colors), ...colors };
  const surface = background ?? theme.colors.surface;
  const border = borderColor ?? theme.colors.border;
  const lines = tokenize(code, language);
  const raw = code.split("\n");

  // Layout: the font shrinks until the widest line and every row fit inside the safe area.
  const adds = diff?.add ?? [];
  const removes = diff?.remove ?? [];
  const marked = adds.concat(removes).sort((a, b) => a - b);
  const digits = String(raw.length).length;
  const columns = (diff ? 2 : 0) + (lineNumbers ? digits + 2 : 0) + Math.max(1, ...raw.map((l) => l.length)) + 1;
  const padX = u(32);
  const padY = u(26);
  const tabH = u(66);
  const maxW = (width - safe.x * 2) * (widthFraction ?? (isLandscape ? 0.72 : 1));
  const maxH = height - safe.top - safe.bottom;
  const fontPx = Math.min(
    u(fontSize),
    (maxW - padX * 2) / (columns * CHAR),
    (maxH - tabH - padY * 2) / (raw.length * LINE),
  );
  const lineH = fontPx * LINE;
  const cardW = Math.min(maxW, Math.max(u(560), padX * 2 + columns * CHAR * fontPx));

  // Timing: typing starts halfway through the entrance, focus follows once everything is on screen.
  const typed = typing !== undefined && typing > 0;
  const start = m.delay + Math.round(m.enterFrames * 0.5);
  const shown = typed ? Math.max(0, Math.floor(((m.frame - start) * (typing as number)) / m.fps)) : code.length;
  const typedAt = typed ? start + Math.ceil((code.length * m.fps) / (typing as number)) : start;
  const focusFrom = highlightAt ?? typedAt + Math.round(m.fps * 0.3);
  const sweep = (order: number) =>
    Math.min(
      1,
      tween(m.frame, m.fps, {
        from: focusFrom + order * Math.round(m.fps * (2 / 30)),
        duration: Math.round(m.fps * 0.45),
        motion: m.preset,
      }),
    );
  const focus = highlightLines.length > 0 ? sweep(0) : 0;
  const blinkOn = Math.floor(m.frame / Math.round(m.fps * 0.5)) % 2 === 0;
  const showCaret = typed && (shown < code.length || (m.frame < focusFrom && blinkOn));

  // Follow: the caret position `lag` frames ago, from the same shown-character formula above evaluated
  // at an earlier frame — always computed (cheap, pure), only measured/used when `follow` is set.
  const laggedShown = typed
    ? Math.max(0, Math.floor(((m.frame - (follow?.lag ?? 6) - start) * (typing as number)) / m.fps))
    : code.length;
  const laggedCode = code.slice(0, laggedShown);
  const laggedCodeLines = laggedCode.split("\n");
  const laggedLineText = laggedCodeLines[laggedCodeLines.length - 1];
  const caretMetrics = useTextMetrics(
    laggedLineText,
    { fontFamily: theme.fonts.mono, fontSize: fontPx, fontWeight: 500 },
    { skip: !follow },
  );
  const caretPosition = { x: caretMetrics.width, y: (laggedCodeLines.length - 1) * lineH };

  let offset = 0;
  const rows = lines.map((tokens, index) => {
    const lineStart = offset;
    const length = raw[index].length;
    offset += length + 1;
    const n = index + 1;
    const added = adds.indexOf(n) >= 0;
    const removed = removes.indexOf(n) >= 0;
    const focused = highlightLines.indexOf(n) >= 0;
    const bandColor = added ? add : removed ? remove : focused ? theme.colors.accent : undefined;
    const band = added || removed ? sweep(marked.indexOf(n)) : focused ? focus : 0;
    const reached = shown >= lineStart;
    return (
      <div
        key={index}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: lineH,
          padding: `0 ${padX}px`,
          opacity: focused || highlightLines.length === 0 ? 1 : 1 - 0.6 * focus,
        }}
      >
        {bandColor && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: alpha(bandColor, 0.14),
              borderLeft: `${u(4)}px solid ${bandColor}`,
              scale: `${band} 1`,
              transformOrigin: "left",
            }}
          />
        )}
        {diff && (
          <span style={{ position: "relative", width: "2ch", flexShrink: 0, color: bandColor, opacity: band }}>
            {added ? "+" : removed ? "-" : ""}
          </span>
        )}
        {lineNumbers && (
          <span
            style={{
              position: "relative",
              width: `${digits}ch`,
              marginRight: "2ch",
              flexShrink: 0,
              textAlign: "right",
              color: theme.colors.muted,
              opacity: reached ? 0.65 : 0,
            }}
          >
            {n}
          </span>
        )}
        <span style={{ position: "relative", whiteSpace: "pre", opacity: removed ? 1 - 0.35 * band : 1 }}>
          {sliceTokens(tokens, Math.max(0, Math.min(length, shown - lineStart))).map((token, k) => (
            <span key={k} style={{ color: palette[token.kind] }}>
              {token.text}
            </span>
          ))}
          {showCaret && reached && shown <= lineStart + length && (
            <span
              style={{
                display: "inline-block",
                width: Math.max(2, fontPx * 0.12),
                height: "1.2em",
                marginLeft: 1,
                verticalAlign: "-0.22em",
                background: theme.colors.accent,
              }}
            />
          )}
        </span>
      </div>
    );
  });

  return (
    <FollowCaret follow={follow} caret={caretPosition}>
      <div
        className={className}
        style={{
          width: cardW,
          borderRadius: u(radius ?? theme.radius * 0.7),
          overflow: "hidden",
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: `0 ${u(2)}px ${u(6)}px ${alpha(theme.colors.shadow, 0.12)}, 0 ${u(28)}px ${u(72)}px ${alpha(theme.colors.shadow, 0.3)}`,
          fontFamily: theme.fonts.mono,
          color: theme.colors.foreground,
          opacity: role.opacity,
          translate: `0 ${(1 - m.enter) * u(40) - m.exit * role.travel(u(40)).exitPx}px`,
          scale: String(0.97 + 0.03 * m.enter),
          ...style,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: u(20),
            height: tabH,
            padding: `0 ${u(24)}px`,
            background: `color-mix(in srgb, ${surface} 55%, ${theme.colors.background})`,
            borderBottom: `1px solid ${border}`,
            fontFamily: theme.fonts.body,
            fontSize: u(22),
          }}
        >
          <div style={{ display: "flex", gap: u(9) }}>
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                style={{ width: u(13), height: u(13), borderRadius: "50%", background: alpha(theme.colors.muted, 0.4) }}
              />
            ))}
          </div>
          {title && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "stretch",
                gap: u(10),
                padding: `0 ${u(20)}px`,
                marginBottom: -1,
                background: surface,
                borderLeft: `1px solid ${border}`,
                borderRight: `1px solid ${border}`,
                boxShadow: `inset 0 ${u(2)}px 0 ${theme.colors.accent}`,
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width={u(20)}
                height={u(20)}
                fill="none"
                stroke={theme.colors.muted}
                strokeWidth={2}
              >
                <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
                <path d="M14 3v4h4" strokeLinejoin="round" />
              </svg>
              {title}
            </div>
          )}
          <div
            style={{
              marginLeft: "auto",
              fontFamily: theme.fonts.mono,
              fontSize: u(18),
              letterSpacing: "0.08em",
              color: theme.colors.muted,
            }}
          >
            {language.toUpperCase()}
          </div>
        </div>
        <div style={{ padding: `${padY}px 0`, fontSize: fontPx, lineHeight: `${lineH}px` }}>{rows}</div>
      </div>
    </FollowCaret>
  );
}
