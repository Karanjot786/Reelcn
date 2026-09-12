/**
 * @title Lower Third
 * @category social
 * @description Name and title strap that slides in above the bottom safe zone and centers itself in vertical video.
 * @duration 30
 * @use Interviews, podcasts, tutorials and talking-head intros
 * @use Naming a speaker, product or location on screen
 * @tags name, title, strap, interview, podcast
 * @example
 * <Sequence durationInFrames={120}>
 *   <LowerThird name="Ada Lovelace" title="Founder, Analytical Engines" variant="card" />
 * </Sequence>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type LowerThirdProps = MotionProps & {
  name: string;
  title?: string;
  variant?: "bar" | "card" | "minimal";
  /** Defaults to `left`, or `center` in portrait. */
  align?: "left" | "center" | "right";
  /** Name color. Defaults to the theme foreground. */
  color?: string;
  /** Title color. Defaults to the theme muted color. */
  mutedColor?: string;
  /** Bar and rule color. Defaults to the theme accent. */
  accentColor?: string;
  /** Card fill for the `card` variant. Defaults to the theme surface. */
  background?: string;
  /** Card border for the `card` variant. Defaults to the theme border. */
  borderColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

/** Reveal the card from its anchored edge; a centered card opens from the middle. */
function revealClip(progress: number, side: "left" | "center" | "right", radiusPx: number) {
  const hidden = (1 - Math.min(progress, 1)) * 100;
  if (side === "left") return `inset(0 ${hidden}% 0 0 round ${radiusPx}px)`;
  if (side === "right") return `inset(0 0 0 ${hidden}% round ${radiusPx}px)`;
  return `inset(0 ${hidden / 2}% 0 ${hidden / 2}% round ${radiusPx}px)`;
}

export function LowerThird({
  name,
  title,
  variant = "bar",
  align,
  color,
  mutedColor,
  accentColor,
  background,
  borderColor,
  style,
  className,
  ...motion
}: LowerThirdProps) {
  const theme = useTheme();
  const { u, safe, isPortrait } = useViewport();
  const m = useMotion(motion);
  const side = align ?? (isPortrait ? "center" : "left");
  const accent = accentColor ?? theme.colors.accent;
  const at = (offset: number) =>
    tween(m.frame, m.fps, { from: m.delay + m.enterFrames * offset, duration: m.enterFrames, motion: m.preset });
  const lineProgress = at(0);
  const nameProgress = at(0.2);
  const titleProgress = at(0.4);
  const radiusPx = u(theme.radius);
  const showBar = variant === "bar" && side !== "center";
  const showRule = variant === "minimal" || (variant === "bar" && side === "center");

  return (
    <AbsoluteFill
      className={className}
      style={{
        justifyContent: "flex-end",
        alignItems: side === "left" ? "flex-start" : side === "right" ? "flex-end" : "center",
        padding: `0 ${safe.x}px ${safe.bottom}px`,
        fontFamily: theme.fonts.body,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: side === "right" ? "row-reverse" : "row",
          alignItems: "stretch",
          gap: u(20),
          textAlign: side,
          opacity: 1 - m.exit,
          translate: `${(side === "right" ? 1 : -1) * m.exit * u(40)}px 0`,
          ...(variant === "card" && {
            background: background ?? alpha(theme.colors.surface, 0.92),
            border: `1px solid ${borderColor ?? theme.colors.border}`,
            borderRadius: radiusPx,
            padding: `${u(24)}px ${u(34)}px`,
            boxShadow: `0 ${u(18)}px ${u(54)}px ${alpha("#000000", 0.3)}`,
            clipPath: revealClip(lineProgress, side, radiusPx),
          }),
        }}
      >
        {showBar && (
          <div
            style={{
              width: u(8),
              borderRadius: u(4),
              background: accent,
              scale: `1 ${Math.min(lineProgress, 1)}`,
              transformOrigin: "bottom",
            }}
          />
        )}
        <div>
          <div style={{ overflow: "hidden", paddingBottom: "0.1em" }}>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: theme.headingWeight,
                fontSize: u(isPortrait ? 64 : 56),
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: color ?? theme.colors.foreground,
                translate: `0 ${(1 - nameProgress) * 110}%`,
              }}
            >
              {name}
            </div>
          </div>
          {title && (
            <div
              style={{
                fontSize: u(isPortrait ? 34 : 30),
                color: mutedColor ?? theme.colors.muted,
                marginTop: u(6),
                opacity: Math.min(Math.max(titleProgress, 0), 1),
                translate: `0 ${(1 - titleProgress) * u(16)}px`,
              }}
            >
              {title}
            </div>
          )}
          {showRule && (
            <div
              style={{
                height: u(5),
                borderRadius: u(3),
                background: accent,
                marginTop: u(14),
                scale: `${Math.min(lineProgress, 1)} 1`,
                transformOrigin: side === "right" ? "right" : side === "center" ? "center" : "left",
              }}
            />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}
