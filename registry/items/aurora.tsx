/**
 * @title Aurora
 * @category backgrounds
 * @description Translucent curtains of accent and highlight light that sway slowly across the top of the frame.
 * @duration sustained
 * @use Atmospheric openers, reveals and calm title scenes
 * @use Night-sky, wellness or premium product moods
 * @avoid Flat, evenly lit color — use `gradient-mesh`
 * @tags aurora, northern lights, curtains, glow, ambient
 * @example
 * <AbsoluteFill>
 *   <Aurora />
 *   <Center><TextReveal text="Hello" /></Center>
 * </AbsoluteFill>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, clamp01, type MotionProps, useMotion, useTheme, useViewport } from "./core";
import { FlatAccentLook, FlatBlocksLook, GrainFieldLook, GridSweepLook } from "./core-physical-light";

export type AuroraProps = MotionProps & {
  /** Base fill. Defaults to the theme background. */
  background?: string;
  /** Curtain colors from back to front. Defaults to accent, highlight, accent. */
  colors?: string[];
  /** Brightest curtain opacity, 0–1. */
  intensity?: number;
  /** Vertical center of the curtains as a share of the canvas height. */
  y?: number;
  /** Sway speed multiplier. 0 freezes the curtains. */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
};

/** Per-curtain weight, tilt (deg) and height share: a wide back curtain, a faint middle one, a narrow bright front. */
const layers = [
  { weight: 1, tilt: -9, band: 0.46 },
  { weight: 0.55, tilt: 6, band: 0.36 },
  { weight: 0.8, tilt: -3, band: 0.28 },
];

// Bright lower hem, long fade upward: the shape of a real curtain.
const curtainMask =
  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 30%, black 62%, black 72%, transparent 100%)";

type AuroraLook = "curtains" | "grid-sweep" | "grain-field" | "flat-blocks" | "flat-accent";

const LOOK_BY_THEME: Record<string, AuroraLook> = {
  daylight: "curtains",
  sunset: "curtains",
  midnight: "grid-sweep",
  paper: "grain-field",
  neon: "flat-blocks",
  mono: "flat-accent",
};

export function Aurora({
  background,
  colors,
  intensity = 0.45,
  y = 0.3,
  speed = 1,
  style,
  className,
  ...motion
}: AuroraProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const palette =
    colors ??
    (theme.name === "daylight"
      ? [theme.colors.foreground, theme.colors.foreground, theme.colors.foreground]
      : [theme.colors.accent, theme.colors.highlight, theme.colors.accent]);
  const seconds = (m.frame / m.fps) * speed;

  const look = LOOK_BY_THEME[theme.name] ?? "curtains";
  const strength = intensity * m.presence;

  if (look === "grid-sweep")
    return (
      <GridSweepLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "grain-field")
    return (
      <GrainFieldLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        palette={palette}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "flat-blocks")
    return (
      <FlatBlocksLook
        theme={theme}
        seconds={seconds}
        strength={strength * 0.5}
        palette={palette}
        background={background}
        className={className}
        style={style}
      />
    );
  if (look === "flat-accent")
    return (
      <FlatAccentLook
        theme={theme}
        seconds={seconds}
        strength={strength}
        background={background}
        className={className}
        style={style}
      />
    );

  return (
    <AbsoluteFill
      className={className}
      style={{ background: background ?? theme.colors.background, overflow: "hidden", ...style }}
    >
      {palette.map((color, index) => {
        const layer = layers[index % layers.length];
        const phase = index * 2.3;
        const sway = Math.sin(seconds * (0.42 + index * 0.09) + phase);
        const swell = Math.sin(seconds * (0.31 + index * 0.05) + phase * 1.7);
        const bandHeight = height * layer.band * (1 + 0.18 * swell);
        const strength = intensity * layer.weight * m.presence;
        const stop = (share: number) => alpha(color, clamp01(strength * share));
        // Soft vertical rays drift sideways inside the curtain; the stop offset moves the whole repeating pattern.
        const rayPeriod = u(120 + index * 45);
        const rayShift = (((seconds * u(38) * (index % 2 === 0 ? 1 : -1)) % rayPeriod) + rayPeriod) % rayPeriod;
        const rays = `repeating-linear-gradient(90deg, ${stop(0)} ${rayShift}px, ${stop(0.55)} ${rayShift + rayPeriod * 0.3}px, ${stop(0)} ${rayShift + rayPeriod * 0.62}px, ${stop(0)} ${rayShift + rayPeriod}px)`;
        const hotspotX = 50 + 32 * Math.sin(seconds * 0.23 + phase);
        const hotspot = `radial-gradient(ellipse 42% 90% at ${hotspotX}% 66%, ${stop(0.75)}, ${stop(0)})`;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: -width * 0.25,
              width: width * 1.5,
              top: y * height - bandHeight * 0.66 + u(40) * sway,
              height: bandHeight,
              rotate: `${layer.tilt + 2.5 * sway}deg`,
              transform: `skewX(${-14 * sway}deg)`,
              backgroundImage: `${rays}, ${hotspot}`,
              backgroundColor: stop(0.32),
              WebkitMaskImage: curtainMask,
              maskImage: curtainMask,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
