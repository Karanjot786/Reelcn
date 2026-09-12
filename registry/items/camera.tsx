/**
 * @title Camera
 * @category motion
 * @description Virtual camera that pans, zooms, rolls and shakes over whatever it wraps, eased between keyframes.
 * @duration data-driven
 * @use Pushing in on a detail of a screenshot, dashboard or illustration, then pulling back out
 * @use Handheld energy or an impact shake on a title card
 * @avoid Giving one element its own zoom or slide entrance, use `animate`
 * @tags camera, zoom, pan, shake, ken burns, push in
 * @example
 * <Camera
 *   keyframes={[
 *     { frame: 0, zoom: 1 },
 *     { frame: 30, x: -210, y: -210, zoom: 2 },
 *     { frame: 75, zoom: 1 },
 *   ]}
 *   shake={4}
 * >
 *   <Img src={staticFile("dashboard.png")} style={{ width: "100%" }} />
 * </Camera>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { type MotionProps, tween, useMotion, useViewport } from "./core";

export type CameraKeyframe = {
  /** Frame at which the camera arrives here, counted from `delay`. */
  frame: number;
  /** Point the camera centers on, in design units right of the canvas center. */
  x?: number;
  /** Point the camera centers on, in design units below the canvas center. */
  y?: number;
  /** 1 shows the whole canvas; 2 fills the frame with a quarter of it. */
  zoom?: number;
  /** Roll in degrees; positive tilts the picture clockwise. */
  rotate?: number;
};

/**
 * Timing comes from `keyframes`. Of the motion props, `delay` shifts every keyframe, `motion` picks the easing between
 * them, and `exit` is off by default (a camera holds its last keyframe); pass it to fade the shot out at the end of the
 * parent Sequence.
 */
export type CameraProps = MotionProps & {
  keyframes: CameraKeyframe[];
  /** Handheld shake amplitude in design units. 0 is a locked-off camera. Over full-bleed footage keep `zoom` a little above 1 so the edges never show. */
  shake?: number;
  /** How fast the shake wobbles, in rough cycles per second. */
  shakeSpeed?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

type Pose = { x: number; y: number; zoom: number; rotate: number };

const rest: Pose = { x: 0, y: 0, zoom: 1, rotate: 0 };

/** Missing values carry over from the previous keyframe, so `{ frame: 60, zoom: 1 }` keeps the current pan. */
function resolvePoses(keyframes: CameraKeyframe[]) {
  const sorted = keyframes.slice().sort((a, b) => a.frame - b.frame);
  const poses: (Pose & { frame: number })[] = [];
  let last = rest;
  for (const key of sorted) {
    last = {
      x: key.x ?? last.x,
      y: key.y ?? last.y,
      zoom: key.zoom ?? last.zoom,
      rotate: key.rotate ?? last.rotate,
    };
    poses.push({ frame: key.frame, ...last });
  }
  return poses;
}

/** Smooth, non-repeating wobble in -1..1 built from three incommensurate sines. */
const wobble = (t: number, phase: number) =>
  Math.sin(t * 2.1 + phase) * 0.55 + Math.sin(t * 3.7 + phase * 1.9) * 0.3 + Math.sin(t * 6.3 + phase * 3.1) * 0.15;

export function Camera({
  keyframes,
  shake = 0,
  shakeSpeed = 1.5,
  exit = false,
  children,
  style,
  className,
  ...motion
}: CameraProps) {
  const { u } = useViewport();
  const m = useMotion({ ...motion, exit });
  const poses = resolvePoses(keyframes);
  let pose: Pose = poses[0] ?? rest;
  for (let index = 1; index < poses.length; index++) {
    const from = poses[index - 1];
    const to = poses[index];
    const p = tween(m.frame, m.fps, { from: m.delay + from.frame, duration: to.frame - from.frame, motion: m.preset });
    if (p <= 0) break;
    pose = {
      x: from.x + (to.x - from.x) * p,
      y: from.y + (to.y - from.y) * p,
      zoom: from.zoom + (to.zoom - from.zoom) * p,
      rotate: from.rotate + (to.rotate - from.rotate) * p,
    };
  }
  const t = (m.frame / m.fps) * shakeSpeed * Math.PI;
  const shakeX = u(shake) * wobble(t, 0);
  const shakeY = u(shake) * wobble(t, 2.4);
  const shakeRotate = shake * 0.06 * wobble(t, 4.8);
  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden", opacity: 1 - m.exit, ...style }}>
      <AbsoluteFill
        style={{
          transformOrigin: "50% 50%",
          transform: [
            `translate(${shakeX}px, ${shakeY}px)`,
            `rotate(${pose.rotate + shakeRotate}deg)`,
            `scale(${Math.max(pose.zoom, 0.01)})`,
            `translate(${-u(pose.x)}px, ${-u(pose.y)}px)`,
          ].join(" "),
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
