/**
 * @title Arrow
 * @category overlays
 * @description Hand-drawn arrow that draws itself from one point to another along a gentle curve, then flicks its head on.
 * @duration 20
 * @use Pointing at a detail in a screenshot, chart or product demo
 * @use Annotating a feature with a short handwritten-style label
 * @avoid Circling a whole card or number — use `scribble-circle`
 * @tags annotation, pointer, hand-drawn, doodle
 * @example
 * <Arrow from={{ x: 27, y: 72 }} to={{ x: 47, y: 48.5 }} label="Best week yet" />
 */
import type React from "react";
import { AbsoluteFill, random } from "remotion";
import { type MotionProps, tween, useMotion, useTheme, useViewport } from "./core";

export type ArrowPoint = { x: number; y: number };

export type ArrowProps = MotionProps & {
  /** Tail, in % of the canvas (0-100 on each axis). */
  from: ArrowPoint;
  /** Tip, in % of the canvas (0-100 on each axis). */
  to: ArrowPoint;
  /** Bend as a share of the arrow's length: 0 is (nearly) straight, negative bends the other way. */
  curve?: number;
  /** Stroke width in design units. */
  strokeWidth?: number;
  /** Arrowhead barb length in design units. Defaults to 5 × `strokeWidth` + 8. */
  headSize?: number;
  /** Text written next to the tail. */
  label?: string;
  /** Label size in design units. */
  labelSize?: number;
  /** Stroke color. Defaults to the theme accent. */
  color?: string;
  /** Label color. Defaults to `color`. */
  labelColor?: string;
  /** Varies the hand-drawn wobble; the same seed always draws the same arrow. */
  seed?: string | number;
  style?: React.CSSProperties;
  className?: string;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function Arrow({
  from,
  to,
  curve = 0.3,
  strokeWidth = 6,
  headSize,
  label,
  labelSize = 40,
  color,
  labelColor,
  seed = "arrow",
  style,
  className,
  ...motion
}: ArrowProps) {
  const theme = useTheme();
  const { u, width, height, safe } = useViewport();
  const m = useMotion(motion);
  const stroke = color ?? theme.colors.accent;
  const sw = u(strokeWidth);
  const head = u(headSize ?? strokeWidth * 5 + 8);
  const x0 = (from.x / 100) * width;
  const y0 = (from.y / 100) * height;
  const x1 = (to.x / 100) * width;
  const y1 = (to.y / 100) * height;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const nx = -dy / length;
  const ny = dx / length;
  // Uneven control points read as a hand stroke rather than a perfect arc.
  const jitter = (key: string) => (random(`${seed}-${key}`) - 0.5) * 0.1;
  const bendA = (curve + jitter("a")) * length;
  const bendB = (curve * 0.8 + jitter("b")) * length;
  const c1x = x0 + dx * 0.3 + nx * bendA;
  const c1y = y0 + dy * 0.3 + ny * bendA;
  const c2x = x0 + dx * 0.75 + nx * bendB;
  const c2y = y0 + dy * 0.75 + ny * bendB;
  const back = Math.atan2(y1 - c2y, x1 - c2x) + Math.PI;
  const barb = (spread: number, scale: number) =>
    `${x1 + Math.cos(back + spread) * head * scale} ${y1 + Math.sin(back + spread) * head * scale}`;
  const shaftPath = `M${x0} ${y0} C${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}`;
  const headPath = `M${barb(0.52, 1)} L${x1} ${y1} L${barb(-0.46, 0.92)}`;

  const shaft = clamp01(m.enter);
  const tip = clamp01(
    tween(m.frame, m.fps, {
      from: m.delay + Math.round(m.enterFrames * 0.8),
      duration: Math.max(Math.round(m.enterFrames * 0.35), 1),
      motion: "snappy",
    }),
  );
  const labelIn = tween(m.frame, m.fps, {
    from: m.delay,
    duration: Math.round(m.enterFrames * 0.7),
    motion: m.preset,
  });

  // Put the label behind the tail, on the side the arrow leaves from. A right/left-anchored box grows
  // with the text (max-content), so when the tail sits near an edge it can push the label past the
  // canvas edge — estimate the label's width and clamp its box into the safe area to avoid that.
  const sx = c1x - x0;
  const sy = c1y - y0;
  const gap = u(20) + sw;
  const estLabelWidth = label ? Math.min(u(420), Math.max(u(100), label.length * u(labelSize) * 0.56)) : 0;
  const labelBox: React.CSSProperties =
    Math.abs(sx) > Math.abs(sy)
      ? sx > 0
        ? {
            left: Math.max(safe.x, x0 - gap - estLabelWidth),
            width: estLabelWidth,
            top: y0,
            translate: "0 -50%",
            textAlign: "right",
          }
        : {
            left: Math.min(width - safe.x - estLabelWidth, x0 + gap),
            width: estLabelWidth,
            top: y0,
            translate: "0 -50%",
            textAlign: "left",
          }
      : sy < 0
        ? { left: x0, top: y0 + gap, translate: "-50% 0", textAlign: "center" }
        : { left: x0, bottom: height - y0 + gap, translate: "-50% 0", textAlign: "center" };
  const strokeProps = {
    fill: "none",
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    pathLength: 1,
    strokeDasharray: 1,
  } as const;

  return (
    <AbsoluteFill className={className} style={{ pointerEvents: "none", opacity: 1 - m.exit, ...style }}>
      <svg
        aria-hidden="true"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {/* Round caps would leave a dot at the start of an undrawn path, so hide each path until it moves. */}
        <path d={shaftPath} {...strokeProps} strokeDashoffset={1 - shaft} opacity={shaft > 0 ? 1 : 0} />
        <path d={headPath} {...strokeProps} strokeDashoffset={1 - tip} opacity={tip > 0 ? 1 : 0} />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            width: "max-content",
            maxWidth: u(420),
            ...labelBox,
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(labelSize),
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: labelColor ?? stroke,
            opacity: clamp01(labelIn),
            rotate: `${-3 + (1 - clamp01(labelIn)) * -4}deg`,
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
}
