/**
 * @title Safe Zone Guide
 * @category overlays
 * @description Dev aid that hatches the regions a platform's own UI would cover. Defaults to the generic `useViewport().safe` insets; a `platform` prop swaps in TikTok, Reels, Shorts or YouTube's own reserved zones.
 * @duration 24
 * @use Checking a caption, lower third or button clears a platform's UI before publishing
 * @use Auditing a layout across 16:9, 9:16 and 1:1 while building a component
 * @avoid Shipping in the final render — this is a development-time guide, not a look
 * @tags safe-zone, guide, dev, platform, tiktok, reels, shorts, youtube
 * @example
 * <SafeZoneGuide platform="tiktok" />
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type SafeZoneGuidePlatform = "tiktok" | "reels" | "shorts" | "youtube";

export type SafeZoneGuideProps = MotionProps & {
  /** Named platform preset for its own reserved UI. Omit for the generic `useViewport().safe` insets. */
  platform?: SafeZoneGuidePlatform;
  /** Hatch and label color. Defaults to the theme highlight. */
  color?: string;
  /** Region fill opacity, 0-1. */
  opacity?: number;
  /** Draw the region names. */
  showLabels?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

type Zone = { edge: "top" | "bottom" | "left" | "right"; fraction: number; label: string };

/** Approximate chrome each platform draws over the frame, as a fraction of the relevant side. Tune against the real app when pixel accuracy matters. */
const PLATFORM_ZONES: Record<SafeZoneGuidePlatform, Zone[]> = {
  tiktok: [
    { edge: "top", fraction: 0.08, label: "Top bar" },
    { edge: "bottom", fraction: 0.22, label: "Caption + toolbar" },
    { edge: "right", fraction: 0.16, label: "Like · comment · share" },
  ],
  reels: [
    { edge: "top", fraction: 0.09, label: "Top bar" },
    { edge: "bottom", fraction: 0.24, label: "Caption + audio" },
    { edge: "right", fraction: 0.15, label: "Like · comment · share" },
  ],
  shorts: [
    { edge: "top", fraction: 0.07, label: "Top bar" },
    { edge: "bottom", fraction: 0.2, label: "Caption + description" },
    { edge: "right", fraction: 0.14, label: "Like · comment · remix" },
  ],
  youtube: [
    { edge: "top", fraction: 0.1, label: "Title safe" },
    { edge: "bottom", fraction: 0.1, label: "Title safe" },
    { edge: "left", fraction: 0.05, label: "Action safe" },
    { edge: "right", fraction: 0.05, label: "Action safe" },
  ],
};

export function SafeZoneGuide({
  platform,
  color,
  opacity = 0.9,
  showLabels = true,
  style,
  className,
  ...motion
}: SafeZoneGuideProps) {
  const theme = useTheme();
  const { u, width, height, safe } = useViewport();
  const m = useMotion(motion);
  const tint = color ?? theme.colors.highlight;
  const shown = Math.min(Math.max(m.enter, 0), 1) * (1 - m.exit);

  const zones: Zone[] =
    platform !== undefined
      ? PLATFORM_ZONES[platform]
      : [
          { edge: "top", fraction: safe.top / height, label: "Top safe" },
          { edge: "bottom", fraction: safe.bottom / height, label: "Bottom safe" },
          { edge: "left", fraction: safe.x / width, label: "Side safe" },
          { edge: "right", fraction: safe.x / width, label: "Side safe" },
        ];

  const stripe = u(10);
  const hatch = `repeating-linear-gradient(45deg, ${alpha(tint, 0.5)} 0, ${alpha(tint, 0.5)} ${u(3)}px, transparent ${u(3)}px, transparent ${stripe}px)`;

  return (
    <AbsoluteFill className={className} style={{ pointerEvents: "none", opacity: opacity * shown, ...style }}>
      {zones.map((zone, i) => {
        const vertical = zone.edge === "top" || zone.edge === "bottom";
        const size = Math.round((vertical ? height : width) * zone.fraction);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...(vertical ? { left: 0, right: 0, height: size } : { top: 0, bottom: 0, width: size }),
              ...(zone.edge === "top" && { top: 0 }),
              ...(zone.edge === "bottom" && { bottom: 0 }),
              ...(zone.edge === "left" && { left: 0 }),
              ...(zone.edge === "right" && { right: 0 }),
              background: hatch,
              borderTop: zone.edge === "bottom" ? `${u(2)}px solid ${tint}` : undefined,
              borderBottom: zone.edge === "top" ? `${u(2)}px solid ${tint}` : undefined,
              borderLeft: zone.edge === "right" ? `${u(2)}px solid ${tint}` : undefined,
              borderRight: zone.edge === "left" ? `${u(2)}px solid ${tint}` : undefined,
              display: "flex",
              alignItems: zone.edge === "top" ? "flex-end" : zone.edge === "bottom" ? "flex-start" : "center",
              justifyContent: "center",
              padding: u(10),
            }}
          >
            {showLabels && (
              <span
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: u(20),
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: tint,
                  background: alpha(theme.colors.background, 0.6),
                  padding: `${u(4)}px ${u(10)}px`,
                  borderRadius: u(6),
                  whiteSpace: "nowrap",
                  writingMode: vertical ? "horizontal-tb" : "vertical-rl",
                }}
              >
                {zone.label}
              </span>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
