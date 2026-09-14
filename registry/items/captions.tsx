/**
 * @title Captions
 * @category social
 * @description Word-synced captions that page like TikTok, highlight the spoken word and pop the words you choose.
 * @duration data-driven
 * @use Shorts, reels and talking-head videos that need burned-in captions
 * @use Podcast and tutorial clips watched without sound
 * @avoid A single static line of text — use `text-reveal`
 * @tags captions, subtitles, karaoke, shorts, accessibility
 * @example
 * import captions from "../../public/captions/talk.json";
 *
 * <Captions captions={captions} emphasize={["free", "today"]} variant="bold-pop" />
 */
import { type Caption, createTikTokStyleCaptions } from "@remotion/captions";
import type React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, tween, useTheme, useViewport } from "./core";

/** Relative luminance, sRGB. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two #rrggbb colors. */
function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Whichever of the two candidates contrasts more with `background`. Falls back to `light` for non-hex colors (theme tokens are always #rrggbb literals, see core.tsx). */
function readableOn(background: string, dark: string, light: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return light;
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}

export type CaptionsVariant =
  | "bold-pop"
  | "karaoke"
  | "boxed"
  | "minimal"
  | "neon"
  | "word-stack"
  | "subtitle-bar"
  | "highlight-box";

export type CaptionsProps = {
  /** Word-level captions, as `@remotion/captions` defines them. `pnpm reelcn-transcribe` writes this shape. */
  captions: Caption[];
  /** How much speech goes on one page, in milliseconds. Lower means fewer words at a time. */
  pageMs?: number;
  /** Hard cap on words per page; long pages are split. */
  maxWords?: number;
  /** Words painted in the emphasis color. Case and punctuation are ignored. */
  emphasize?: string[];
  variant?: CaptionsVariant;
  /** `auto` sits above the platform UI in portrait and in the lower third elsewhere. */
  position?: "auto" | "top" | "middle" | "bottom";
  /** Font size in design units; long pages shrink from here. */
  size?: number;
  color?: string;
  activeColor?: string;
  emphasisColor?: string;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
};

type Token = { text: string; fromMs: number; toMs: number };
type Page = { tokens: Token[]; startMs: number; endMs: number };

const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Pages from @remotion/captions, split again so no page exceeds `maxWords`. */
function paginate(captions: Caption[], pageMs: number, maxWords: number): Page[] {
  const { pages } = createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: pageMs });
  const out: Page[] = [];
  for (const page of pages) {
    for (let index = 0; index < page.tokens.length; index += maxWords) {
      const tokens = page.tokens.slice(index, index + maxWords);
      if (tokens.length === 0) continue;
      out.push({ tokens, startMs: tokens[0].fromMs, endMs: tokens[tokens.length - 1].toMs });
    }
  }
  return out;
}

export function Captions({
  captions,
  pageMs = 1200,
  maxWords = 6,
  emphasize = [],
  variant = "bold-pop",
  position = "auto",
  size = 64,
  color,
  activeColor,
  emphasisColor,
  background,
  style,
  className,
}: CaptionsProps) {
  const { fps } = useVideoConfig();
  const { u, height, safe, isPortrait } = useViewport();
  const theme = useTheme();
  const pages = paginate(captions, pageMs, maxWords);
  const emphasized: Record<string, true> = {};
  for (const word of emphasize) emphasized[normalize(word)] = true;

  const place = position === "auto" ? (isPortrait ? "bottom" : "lower") : position;
  const box: React.CSSProperties =
    place === "top"
      ? { top: safe.top, justifyContent: "flex-start", alignItems: "center" }
      : place === "middle"
        ? { top: 0, bottom: 0, justifyContent: "center", alignItems: "center" }
        : place === "bottom"
          ? // AbsoluteFill already sets top: 0 and height: 100%; without unsetting top, "bottom" is
            // dropped as over-constrained and captions render flush against the frame edge.
            { top: "auto", bottom: safe.bottom + u(40), justifyContent: "flex-end", alignItems: "center" }
          : { top: "auto", bottom: height * 0.14, justifyContent: "flex-end", alignItems: "center" };

  return (
    <AbsoluteFill className={className} style={{ justifyContent: "center", ...style }}>
      {pages.map((page, index) => {
        const next = pages[index + 1];
        const endMs = Math.min(next ? next.startMs : page.endMs + 320, page.endMs + 320);
        const from = Math.round((page.startMs / 1000) * fps);
        const durationInFrames = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={page.startMs} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <AbsoluteFill style={{ display: "flex", justifyContent: "center", ...box, position: "absolute" }}>
              <CaptionPage
                page={page}
                variant={variant}
                emphasized={emphasized}
                size={size}
                color={color ?? theme.colors.foreground}
                activeColor={activeColor ?? theme.colors.accent}
                emphasisColor={emphasisColor ?? theme.colors.highlight}
                background={background ?? theme.colors.surface}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function CaptionPage({
  page,
  variant,
  emphasized,
  size,
  color,
  activeColor,
  emphasisColor,
  background,
}: {
  page: Page;
  variant: CaptionsVariant;
  emphasized: Record<string, true>;
  size: number;
  color: string;
  activeColor: string;
  emphasisColor: string;
  background: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, width, safe } = useViewport();
  const theme = useTheme();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const characters = page.tokens.reduce((total, token) => total + token.text.length, 0);
  // Long pages shrink so a caption never runs past the safe area.
  const fontPx = u(size) * Math.min(1, 26 / Math.max(26, characters));
  const enter = tween(frame, fps, { duration: Math.round(fps * 0.18), motion: "snappy" });
  const stack = variant === "word-stack";
  // Asymmetric ramp: 4 frames to snap up to the peak scale, 9 to settle back down — reads as a real
  // emphasis pop, not a symmetric pulse (spec P2-6a). `active` is computed per-word below; this is the
  // shape of the ramp, evaluated per-word at its own fromMs/toMs.
  const emphasisScale = (activeSinceFrames: number) =>
    activeSinceFrames < 0
      ? 1
      : activeSinceFrames <= 4
        ? 1 + (0.55 * activeSinceFrames) / 4
        : Math.max(1, 1.55 - (0.55 * Math.min(activeSinceFrames - 4, 9)) / 9);

  const words = page.tokens.map((token, index) => {
    const active = token.fromMs <= nowMs && nowMs < token.toMs;
    const spoken = nowMs >= token.toMs;
    const isEmphasis = emphasized[normalize(token.text)] === true;
    const base: React.CSSProperties = { display: "inline-block", whiteSpace: "pre" };
    const tone = isEmphasis ? emphasisColor : active ? activeColor : color;

    if (variant === "karaoke") {
      return (
        <span key={index} style={{ ...base, color: spoken || active ? tone : alpha(color, 0.45) }}>
          {token.text}
        </span>
      );
    }
    if (variant === "boxed") {
      return (
        <span
          key={index}
          style={{
            ...base,
            padding: `${u(6)}px ${u(14)}px`,
            margin: u(4),
            borderRadius: u(10),
            background: active ? tone : alpha(background, 0.92),
            color: active ? theme.colors.accentForeground : isEmphasis ? emphasisColor : color,
          }}
        >
          {token.text.trim()}
        </span>
      );
    }
    if (variant === "highlight-box") {
      const boxText = readableOn(emphasisColor, theme.colors.background, theme.colors.foreground);
      return (
        <span
          key={index}
          style={{
            ...base,
            color: active ? boxText : tone,
            background: active ? emphasisColor : "transparent",
            padding: `0 ${u(6)}px`,
            borderRadius: u(4),
          }}
        >
          {token.text}
        </span>
      );
    }
    if (variant === "neon") {
      return (
        <span
          key={index}
          style={{
            ...base,
            color: active || isEmphasis ? tone : color,
            // The glow is this variant's whole point.
            textShadow: active ? `0 0 ${u(18)}px ${alpha(tone, 0.9)}, 0 0 ${u(44)}px ${alpha(tone, 0.55)}` : "none",
          }}
        >
          {token.text}
        </span>
      );
    }
    if (variant === "minimal" || variant === "subtitle-bar") {
      return (
        <span key={index} style={{ ...base, color: active || isEmphasis ? tone : color }}>
          {token.text}
        </span>
      );
    }
    // bold-pop and word-stack: the spoken word grows, substantially, on an asymmetric ramp (P2-6a).
    const activeSinceFrames = active ? Math.round(((nowMs - token.fromMs) / 1000) * fps) : -1;
    const scale = emphasisScale(activeSinceFrames);
    const neonPill = theme.name === "neon" && active;
    const wordSpan = (
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          color: neonPill ? theme.colors.accentForeground : tone,
          scale: String(scale),
          translate: stack && active ? `0 ${-u(4)}px` : undefined,
        }}
      >
        {token.text}
      </span>
    );
    if (!neonPill) {
      // The scale transform above doesn't reserve layout space, so at peak scale the word can
      // touch its neighbors. Reserve a matching horizontal gap sized off the same `scale` and the
      // word's own character count (in `ch`, so it tracks glyph width without measuring the DOM) —
      // a longer word overflows its box by more absolute space at the same scale, so it needs a
      // proportionally wider gap.
      const gap = `${((scale - 1) / 2) * token.text.trim().length}ch`;
      return (
        <span key={index} style={{ display: "inline-block", marginInline: gap }}>
          {wordSpan}
        </span>
      );
    }
    // neon/Pop: a real filled pill behind the active word, sized with padding and font-size — not a
    // CSS transform:scale() on a fixed box, which doesn't reserve layout space and clips neighboring
    // text (the exact bug the approved theme mockups fixed; see out/theme-proposals/README.md's
    // "rendering fixes" note).
    return (
      <span
        key={index}
        style={{
          display: "inline-flex",
          padding: `0.05em ${u(10)}px`,
          margin: `0 ${u(2)}px`,
          borderRadius: u(theme.radius),
          background: theme.colors.accent,
        }}
      >
        {wordSpan}
      </span>
    );
  });

  const shared: React.CSSProperties = {
    maxWidth: width - safe.x * 2,
    textAlign: "center",
    fontFamily: theme.fonts.heading,
    fontWeight: variant === "minimal" || variant === "subtitle-bar" ? 600 : theme.headingWeight,
    fontSize: fontPx,
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
    opacity: Math.min(enter, 1),
    translate: `0 ${(1 - Math.min(enter, 1)) * u(14)}px`,
  };

  if (variant === "subtitle-bar") {
    return (
      <div
        style={{
          ...shared,
          background: alpha(background, 0.82),
          padding: `${u(12)}px ${u(24)}px`,
          borderRadius: u(8),
        }}
      >
        {words}
      </div>
    );
  }

  if (stack) {
    return (
      <div style={{ ...shared, display: "flex", flexDirection: "column", alignItems: "center", gap: u(2) }}>
        {words}
      </div>
    );
  }

  return (
    <div
      style={{
        ...shared,
        textShadow: variant === "bold-pop" ? `0 ${u(4)}px ${u(18)}px ${alpha("#000000", 0.45)}` : undefined,
      }}
    >
      {words}
    </div>
  );
}
