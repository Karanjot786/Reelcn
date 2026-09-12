/**
 * @title Phone Frame
 * @category product
 * @description Rounded phone body with a pill cutout at the top and a gesture bar at the bottom, clipping your screen content to the display's corners.
 * @duration data-driven
 * @use Framing an app screen, onboarding flow or social feed in a product video
 * @use Two phones side by side inside `split-screen` for a before/after
 * @avoid A laptop or desktop screen — use `laptop-frame`
 * @tags phone, mobile, device, mockup, frame, app
 * @example
 * <Center>
 *   <PhoneFrame>
 *     <div style={{ width: "100%", height: "100%", background: "#fff" }} />
 *   </PhoneFrame>
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type PhoneFrameProps = MotionProps & {
  /** Frame height as a fraction of the safe area (0–1). Defaults to 0.86 in portrait, 0.82 otherwise. */
  height?: number;
  /** Screen aspect ratio (width / height). Defaults to 9/19.5. */
  aspect?: number;
  children?: React.ReactNode;
  /** Body color. Defaults to a shade between the theme surface and foreground. */
  color?: string;
  /** Screen fill behind the children. Defaults to the theme background. */
  screenColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function PhoneFrame({
  height: heightFraction,
  aspect = 9 / 19.5,
  children,
  color,
  screenColor,
  style,
  className,
  ...motion
}: PhoneFrameProps) {
  const theme = useTheme();
  const { u, width, height, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const body = color ?? `color-mix(in srgb, ${theme.colors.foreground} 14%, ${theme.colors.surface})`;
  const maxH = (height - safe.top - safe.bottom) * (heightFraction ?? (isPortrait ? 0.86 : 0.82));
  const maxW = width - safe.x * 2;
  const frameH = Math.min(maxH, maxW / aspect);
  const frameW = frameH * aspect;
  const bezelSide = u(14);
  const bezelTop = u(30);
  const bezelBottom = u(22);
  const outerRadius = u(46);
  const screenRadius = u(32);
  const screenW = frameW - bezelSide * 2;
  const screenH = frameH - bezelTop - bezelBottom;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: frameW,
        height: frameH,
        borderRadius: outerRadius,
        background: body,
        boxShadow: `0 ${u(24)}px ${u(64)}px ${alpha("#000000", 0.35)}, inset 0 0 0 ${u(2)}px ${alpha("#000000", 0.25)}`,
        opacity: Math.min(1, Math.max(0, m.enter)) * (1 - m.exit),
        translate: `0 ${(1 - m.enter) * u(50) - m.exit * u(28)}px`,
        scale: String(0.94 + 0.06 * m.enter),
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: bezelSide,
          top: bezelTop,
          width: screenW,
          height: screenH,
          borderRadius: screenRadius,
          overflow: "hidden",
          background: screenColor ?? theme.colors.background,
        }}
      >
        {children}
      </div>
      {/* Camera/sensor cutout — a hole in the bezel, so it stays near-black regardless of theme. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: u(10),
          translate: "-50% 0",
          width: u(84),
          height: u(18),
          borderRadius: u(9),
          background: alpha("#000000", 0.85),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: u(8),
          translate: "-50% 0",
          width: u(110),
          height: u(5),
          borderRadius: u(3),
          background: alpha(theme.colors.foreground, 0.35),
        }}
      />
    </div>
  );
}
