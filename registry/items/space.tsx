/**
 * @title Space
 * @category motion
 * @description Scoped 3D: children placed at x/y/z, visited by a look-at camera that slerps between beats. Our own ~80-line matrix/quaternion math, no three.js.
 * @duration data-driven
 * @use A small product or feature cluster the camera pushes through or reframes around
 * @use A 3D "gallery" of cards or screenshots without CSS 3D's sibling depth-sorting problem
 * @avoid Scenes with many overlapping opaque volumes — this only depth-sorts flat children, painter's-algorithm style
 * @tags 3d, camera, space, perspective, slerp, matrix
 * @example
 * <Space
 *   beats={[
 *     { frame: 0, lookAt: [0, 0, 0], distance: 6 },
 *     { frame: 60, lookAt: [1.2, 0, 0], distance: 4 },
 *   ]}
 * >
 *   {[
 *     { x: 0, y: 0, z: 0, children: <Img src={staticFile("a.png")} style={{ width: 200 }} /> },
 *     { x: 1.4, y: 0, z: -0.4, children: <Img src={staticFile("b.png")} style={{ width: 200 }} /> },
 *   ]}
 * </Space>
 */
import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  type Mat4,
  mat4LookAt,
  projectPoint,
  type Quat,
  quatFromLookAt,
  quatSlerp,
  tween,
  useViewport,
  type Vec3,
} from "./core";

export type SpaceChild = { x: number; y: number; z: number; rotateY?: number; children: React.ReactNode };
export type SpaceBeat = { frame: number; lookAt: [number, number, number]; distance: number; roll?: number };
export type SpaceProps = { beats: SpaceBeat[]; fov?: number; children: SpaceChild[] };

const vadd = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const vscale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const vlerp = (a: Vec3, b: Vec3, t: number): Vec3 => vadd(a, vscale(vadd(b, vscale(a, -1)), t));
const vcross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/** Rotates the camera's forward axis `(0,0,-1)` by `q` — the standard `v + 2*cross(qv, cross(qv,v) + q.w*v)` formula. */
function forwardAxis(q: Quat): Vec3 {
  const v: Vec3 = { x: 0, y: 0, z: -1 };
  const qv: Vec3 = { x: q.x, y: q.y, z: q.z };
  const uv = vcross(qv, v);
  const uuv = vcross(qv, uv);
  return vadd(vadd(v, vscale(uv, 2 * q.w)), vscale(uuv, 2));
}

function beatCamera(beat: SpaceBeat) {
  const target: Vec3 = { x: beat.lookAt[0], y: beat.lookAt[1], z: beat.lookAt[2] };
  const eye: Vec3 = { x: target.x, y: target.y, z: target.z + beat.distance };
  return { eye, quat: quatFromLookAt(eye, target) };
}

export function Space({ beats, fov = 50, children }: SpaceProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, orientation } = useViewport();
  const sorted = beats.slice().sort((a, b) => a.frame - b.frame);
  const firstFrame = sorted[0]?.frame ?? 0;
  const lastFrame = sorted[sorted.length - 1]?.frame ?? 0;
  const clamped = Math.min(Math.max(frame, firstFrame), lastFrame);
  let index = 0;
  while (index < sorted.length - 2 && clamped >= sorted[index + 1].frame) index++;
  const fromBeat = sorted[Math.min(index, sorted.length - 1)];
  const toBeat = sorted[Math.min(index + 1, sorted.length - 1)];
  const from = beatCamera(fromBeat);
  const to = beatCamera(toBeat);
  const span = Math.max(toBeat.frame - fromBeat.frame, 1);
  const t = sorted.length > 1 ? tween(clamped, fps, { from: fromBeat.frame, duration: span, motion: "linear" }) : 0;

  const eye = vlerp(from.eye, to.eye, t);
  const quat = quatSlerp(from.quat, to.quat, t);
  const target = vadd(eye, forwardAxis(quat));
  const view: Mat4 = mat4LookAt(eye, target);

  // Portrait reframes with a closer camera and a touch more fov instead of letterboxing to one fit-to-box scale.
  const reframedFov = orientation === "portrait" ? fov * 1.15 : fov;
  const aspect = width / height;
  const shortSide = Math.min(width, height);

  type Placed = { key: number; child: SpaceChild; x: number; y: number; depth: number; scale: number };
  const placed: Placed[] = [];
  for (let key = 0; key < children.length; key++) {
    const child = children[key];
    const projected = projectPoint({ x: child.x, y: child.y, z: child.z }, view, reframedFov, aspect);
    if (projected.depth <= 0) continue;
    placed.push({
      key,
      child,
      x: projected.x,
      y: projected.y,
      depth: projected.depth,
      scale: shortSide / 2 / projected.depth,
    });
  }
  // Painter's algorithm: farthest first, so nearer children draw on top — no CSS 3D sibling sorting.
  placed.sort((a, b) => b.depth - a.depth);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {placed.map(({ key, child, x, y, scale }) => (
        <div
          key={key}
          style={{
            position: "absolute",
            left: width / 2 + (x * shortSide) / 2,
            top: height / 2 - (y * shortSide) / 2,
            transform: `translate(-50%, -50%) scale(${scale}) rotateY(${child.rotateY ?? 0}deg)`,
          }}
        >
          {child.children}
        </div>
      ))}
    </AbsoluteFill>
  );
}
