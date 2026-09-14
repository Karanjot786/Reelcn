/**
 * @title Toast
 * @category product
 * @description Notification card with a status icon that slides in from an edge, holds, then slides back out.
 * @duration 90
 * @use Confirming an action, a deploy, an upload or a saved state in a product demo
 * @use A short system message that appears over a UI mockup
 * @avoid A message pointing at part of the screen — use `callout`
 * @tags toast, notification, alert, snackbar, status
 * @example
 * <Toast variant="success" title="Deployed" description="Live in 12 regions" />
 */
import type React from "react";
import { alpha, clamp01, type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type ToastVariant = "success" | "info" | "warning" | "error";

export type ToastProps = MotionProps & {
  variant?: ToastVariant;
  title: string;
  description?: string;
  /** Edge it slides from. Defaults to `top` in portrait, `bottom-right` otherwise. */
  edge?: "top" | "bottom" | "bottom-right" | "top-right";
  /** Card width in design units. */
  width?: number;
  background?: string;
  borderColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  /** Icon well and stroke color. Defaults per `variant`. */
  accentColor?: string;
  /** Corner radius in design units. Defaults to 70% of the theme radius. */
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <path d="M5 13l4 4L19 7" />;
  if (variant === "info")
    return (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    );
  if (variant === "warning")
    return (
      <>
        <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    );
  return (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </>
  );
}

export function Toast({
  variant = "info",
  title,
  description,
  edge,
  width = 380,
  background,
  borderColor,
  titleColor,
  descriptionColor,
  accentColor,
  radius,
  style,
  className,
  ...motion
}: ToastProps) {
  const theme = useTheme();
  const { u, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const side = edge ?? (isPortrait ? "top" : "bottom-right");
  const defaultTone: Record<ToastVariant, string> = {
    success: "#22c55e",
    info: theme.colors.accent,
    warning: "#f59e0b",
    error: "#ef4444",
  };
  const tone = accentColor ?? defaultTone[variant];
  const border = borderColor ?? theme.colors.border;
  const cardW = u(width);
  const enter = clamp01(m.enter);
  const away = 1 - enter + m.exit;
  const centered = side === "top" || side === "bottom";
  const dir = side === "top" ? -1 : 1;
  const travel = u(70);
  const slide = dir * away * travel;
  const translate = centered ? `-50% ${slide}px` : `${slide}px 0`;
  const position: React.CSSProperties =
    side === "top"
      ? { top: safe.top, left: "50%" }
      : side === "bottom"
        ? { bottom: safe.bottom, left: "50%" }
        : side === "top-right"
          ? { top: safe.top, right: safe.x }
          : { bottom: safe.bottom, right: safe.x };

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        ...position,
        width: cardW,
        display: "flex",
        gap: u(14),
        padding: u(18),
        borderRadius: u(radius ?? theme.radius * 0.7),
        background: background ?? theme.colors.surface,
        border: `1px solid ${border}`,
        boxShadow: `0 ${u(16)}px ${u(44)}px ${alpha("#000000", 0.28)}`,
        opacity: enter * (1 - m.exit),
        translate,
        fontFamily: theme.fonts.body,
        ...style,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: u(34),
          height: u(34),
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: alpha(tone, 0.16),
          color: tone,
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={u(18)}
          height={u(18)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ToastIcon variant={variant} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: u(24), fontWeight: 600, color: titleColor ?? theme.colors.foreground }}>{title}</div>
        {description && (
          <div style={{ marginTop: u(4), fontSize: u(20), color: descriptionColor ?? theme.colors.muted }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
