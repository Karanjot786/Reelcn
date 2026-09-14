/**
 * @title Laptop Frame
 * @category product
 * @description Laptop lid with a bezel around your screen content, sitting on a simple deck with a hinge line.
 * @duration data-driven
 * @use Framing a desktop app, dashboard or website screenshot in a launch video
 * @use Two builds side by side inside `split-screen` for a before/after
 * @avoid A phone or tablet screen — use `phone-frame`
 * @tags laptop, desktop, computer, device, mockup, frame
 * @example
 * <Center>
 *   <LaptopFrame>
 *     <div style={{ width: "100%", height: "100%", background: "#fff" }} />
 *   </LaptopFrame>
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type LaptopFrameProps = MotionProps & {
  /** Screen width as a fraction of the safe area (0–1). Defaults to 0.78 in landscape, 0.94 otherwise. */
  width?: number;
  /** Screen aspect ratio (width / height). Defaults to 16/10. */
  aspect?: number;
  children?: React.ReactNode;
  /** Body color. Defaults to a shade between the theme surface and foreground. */
  color?: string;
  /** Screen fill behind the children. Defaults to the theme background. */
  screenColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function LaptopFrame({
  width: widthFraction,
  aspect = 16 / 10,
  children,
  color,
  screenColor,
  style,
  className,
  ...motion
}: LaptopFrameProps) {
  const theme = useTheme();
  const { u, width, height, safe, isLandscape } = useViewport();
  const m = useMotion(motion);
  const body = color ?? `color-mix(in srgb, ${theme.colors.foreground} 16%, ${theme.colors.surface})`;
  const bezel = u(20);
  const deckH = u(26);
  const maxScreenW = (width - safe.x * 2) * (widthFraction ?? (isLandscape ? 0.78 : 0.94)) - bezel * 2;
  const maxScreenH = height - safe.top - safe.bottom - bezel * 2 - deckH - u(16);
  const screenW = Math.min(maxScreenW, maxScreenH * aspect);
  const screenH = screenW / aspect;
  const lidW = screenW + bezel * 2;
  const lidH = screenH + bezel * 2;
  const deckW = lidW * 1.06;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: Math.min(1, Math.max(0, m.enter)) * (1 - m.exit),
        translate: `0 ${(1 - m.enter) * u(40) - m.exit * u(24)}px`,
        // A small fixed 3D tilt reads as a real product shot instead of a flat cutout (P2-6b). Not
        // user-adjustable — a real camera control is Phase 3's `stage`.
        transform: "perspective(1400px) rotateX(4deg)",
        transformStyle: "preserve-3d",
        scale: String(0.96 + 0.04 * m.enter),
        filter: `drop-shadow(0 ${u(theme.material?.floorShadow === "soft" ? 36 : 20)}px ${u(theme.material?.floorShadow === "soft" ? 46 : 12)}px ${alpha(theme.colors.shadow, theme.material?.floorShadow === "soft" ? 0.28 : 0.45)})`,
        ...style,
      }}
    >
      <div
        style={{
          width: lidW,
          height: lidH,
          padding: bezel,
          borderRadius: `${u(14)}px ${u(14)}px ${u(4)}px ${u(4)}px`,
          background: body,
          boxShadow: `inset 0 0 0 ${u(1.5)}px ${alpha("#000000", 0.3)}`,
        }}
      >
        <div
          style={{
            width: screenW,
            height: screenH,
            borderRadius: u(4),
            overflow: "hidden",
            background: screenColor ?? theme.colors.background,
            position: "relative",
          }}
        >
          {children}
          {/* Key-light sheen: one clipped highlight sweep across the glass, at most once, on load (rule M9). */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `linear-gradient(115deg, transparent 20%, ${alpha("#ffffff", 0.16)} 32%, transparent 44%)`,
              translate: `${-40 + 180 * Math.min(m.enter, 1)}% 0`,
              opacity: m.enter > 0 && m.enter < 1.4 ? 1 : 0,
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: deckW,
          height: deckH,
          borderRadius: `0 0 ${u(10)}px ${u(10)}px`,
          background: body,
          boxShadow: `0 ${u(10)}px ${u(24)}px ${alpha("#000000", 0.35)}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Hinge shadow line where the lid meets the deck. */}
        <div
          style={{
            width: u(120),
            height: u(4),
            marginTop: u(-2),
            borderRadius: u(2),
            background: alpha("#000000", 0.25),
          }}
        />
      </div>
    </div>
  );
}
