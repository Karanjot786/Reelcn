/**
 * @title Browser Window
 * @category product
 * @description Neutral browser chrome with back/forward arrows and a rounded url pill, wrapped around any page content you pass as children.
 * @duration data-driven
 * @use Framing a website, landing page or web app screenshot in a launch or demo video
 * @use Two pages side by side inside `split-screen` for a before/after
 * @avoid A native desktop app with a title bar and no address bar — use `app-window`
 * @tags browser, chrome, url, website, mockup, frame
 * @example
 * <Center>
 *   <BrowserWindow url="reelcn.dev/pricing">
 *     <div style={{ width: "100%", height: "100%", background: "#fff" }} />
 *   </BrowserWindow>
 * </Center>
 */
import type React from "react";
import { alpha, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type BrowserWindowProps = MotionProps & {
  /** Text shown in the address pill. */
  url?: string;
  /** Shows a small lock icon before the url. */
  secure?: boolean;
  /** Window width as a fraction of the safe area (0–1). Defaults to 0.86 in landscape, 1 otherwise. */
  width?: number;
  /** Window aspect ratio (width / height). Defaults to 16/10. */
  aspect?: number;
  children?: React.ReactNode;
  /** Chrome bar fill. Defaults to the theme surface. */
  barColor?: string;
  /** Page fill behind the children. Defaults to the theme background. */
  background?: string;
  borderColor?: string;
  /** Address pill text color. Defaults to the theme muted color. */
  urlColor?: string;
  /** Corner radius in design units. Defaults to the theme radius. */
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

export function BrowserWindow({
  url = "example.com",
  secure = true,
  width: widthFraction,
  aspect = 16 / 10,
  children,
  barColor,
  background,
  borderColor,
  urlColor,
  radius,
  style,
  className,
  ...motion
}: BrowserWindowProps) {
  const theme = useTheme();
  const { u, width, height, safe, isLandscape } = useViewport();
  const m = useMotion(motion);
  const border = borderColor ?? theme.colors.border;
  const bar = barColor ?? theme.colors.surface;
  const maxW = (width - safe.x * 2) * (widthFraction ?? (isLandscape ? 0.86 : 1));
  const maxH = height - safe.top - safe.bottom;
  const barH = u(58);
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
          display: "flex",
          alignItems: "center",
          gap: u(18),
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
        <div style={{ display: "flex", gap: u(6), color: alpha(theme.colors.muted, 0.6) }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width={u(16)}
            height={u(16)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width={u(16)}
            height={u(16)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: u(8),
            height: u(36),
            borderRadius: u(18),
            background: alpha(theme.colors.muted, 0.14),
            fontSize: u(19),
            color: urlColor ?? theme.colors.muted,
          }}
        >
          {secure && (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width={u(14)}
              height={u(14)}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: cardW, height: cardH - barH, overflow: "hidden" }}>{children}</div>
    </div>
  );
}
