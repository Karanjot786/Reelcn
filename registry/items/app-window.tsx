/**
 * @title App Window
 * @category product
 * @description Native desktop window with a title bar and no address bar, wrapped around any app content you pass as children.
 * @duration data-driven
 * @use Framing a desktop app, editor or settings panel in a launch video
 * @use Two app windows side by side inside `split-screen`
 * @avoid A website with an address bar — use `browser-window`
 * @tags window, app, desktop, chrome, mockup, frame
 * @example
 * <Center>
 *   <AppWindow title="Settings">
 *     <div style={{ width: "100%", height: "100%", background: "#fff" }} />
 *   </AppWindow>
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type AppWindowProps = MotionProps & {
  /** Shown centered in the title bar. */
  title?: string;
  /** Window width as a fraction of the safe area (0–1). Defaults to 0.8 in landscape, 1 otherwise. */
  width?: number;
  /** Window aspect ratio (width / height). Defaults to 16/10. */
  aspect?: number;
  children?: React.ReactNode;
  barColor?: string;
  background?: string;
  borderColor?: string;
  titleColor?: string;
  /** Corner radius in design units. Defaults to the theme radius. */
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function AppWindow({
  title,
  width: widthFraction,
  aspect = 16 / 10,
  children,
  barColor,
  background,
  borderColor,
  titleColor,
  radius,
  style,
  className,
  ...motion
}: AppWindowProps) {
  const theme = useTheme();
  const { u, width, height, safe, isLandscape } = useViewport();
  const m = useMotion(motion);
  const border = borderColor ?? theme.colors.border;
  const bar = barColor ?? theme.colors.surface;
  const maxW = (width - safe.x * 2) * (widthFraction ?? (isLandscape ? 0.8 : 1));
  const maxH = height - safe.top - safe.bottom;
  const barH = u(54);
  const cardW = Math.min(maxW, (maxH - barH) * aspect);
  const cardH = cardW / aspect + barH;
  const r = u(radius ?? theme.radius);

  return (
    <div
      className={className}
      style={{
        width: cardW,
        height: cardH,
        borderRadius: r,
        overflow: "hidden",
        background: background ?? theme.colors.background,
        border: `1px solid ${border}`,
        boxShadow: `0 ${u(2)}px ${u(6)}px ${alpha("#000000", 0.12)}, 0 ${u(28)}px ${u(72)}px ${alpha("#000000", 0.3)}`,
        fontFamily: theme.fonts.body,
        opacity: Math.min(1, Math.max(0, m.enter)) * (1 - m.exit),
        translate: `0 ${(1 - m.enter) * u(40) - m.exit * u(24)}px`,
        scale: String(0.97 + 0.03 * m.enter),
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: barH,
          padding: `0 ${u(20)}px`,
          background: bar,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ display: "flex", gap: u(9) }}>
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              style={{ width: u(12), height: u(12), borderRadius: "50%", background: alpha(theme.colors.muted, 0.4) }}
            />
          ))}
        </div>
        {title && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              translate: "-50% 0",
              fontSize: u(21),
              fontWeight: 600,
              color: titleColor ?? theme.colors.foreground,
            }}
          >
            {title}
          </div>
        )}
      </div>
      <div style={{ position: "relative", width: cardW, height: cardH - barH, overflow: "hidden" }}>{children}</div>
    </div>
  );
}
