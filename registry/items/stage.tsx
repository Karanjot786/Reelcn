/**
 * @title Stage
 * @category motion
 * @description Perspective studio plane: a look-at camera that pans and zooms between normalized targets, plus a contact-shadow floor and a soft key light, both usable standalone.
 * @duration data-driven
 * @use A product shot staged on a lit floor that the camera moves around
 * @use Pairing with `laptop-frame`/`phone-frame`/`browser-window` for a studio-lit device shot
 * @tags stage, studio, floor, light, look-at, camera
 * @example
 * <Stage keyframes={[{ frame: 0, targetX: 0.5, targetY: 0.5 }, { frame: 60, targetX: 0.7, targetY: 0.3, zoom: 1.6 }]}>
 *   <Stage.Floor shadow="soft" />
 *   <Stage.KeyLight angle={35} />
 *   <Img src={staticFile("product.png")} style={{ width: "100%" }} />
 * </Stage>
 */
import type React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, lookAtOffset, type PoseKey, useKeyframePath, useTheme, useViewport } from "./core";

export type StageKeyframe = {
  frame: number;
  /** 0-1 of the content, left to right. */
  targetX: number;
  /** 0-1 of the content, top to bottom. */
  targetY: number;
  zoom?: number;
};

export type StageProps = {
  keyframes: StageKeyframe[];
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export function StageFloor({ shadow }: { shadow?: "hard" | "soft" }) {
  const theme = useTheme();
  const { u } = useViewport();
  const soft = (shadow ?? theme.material?.floorShadow ?? "soft") === "soft";
  return (
    <div
      style={{
        position: "absolute",
        left: "10%",
        right: "10%",
        bottom: u(-40),
        height: u(soft ? 140 : 60),
        borderRadius: "50%",
        background: alpha(theme.colors.shadow, soft ? 0.35 : 0.55),
        filter: `blur(${u(soft ? 60 : 14)}px)`,
      }}
    />
  );
}

export function StageKeyLight({ angle = 35, intensity = 0.5 }: { angle?: number; intensity?: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = 50 + Math.cos(rad) * 60;
  const y = 50 - Math.sin(rad) * 60;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${0.22 * intensity}), transparent 55%)`,
        pointerEvents: "none",
      }}
    />
  );
}

export function Stage({ keyframes, children, style, className }: StageProps) {
  const { width, height } = useViewport();
  const keys: PoseKey[] = keyframes.map((k) => ({ frame: k.frame, x: k.targetX, y: k.targetY, scale: k.zoom ?? 1 }));
  const path = useKeyframePath(keys);
  const zoom = path.scale ?? 1;
  const offset = lookAtOffset({ x: path.x, y: path.y }, zoom, { width, height });

  return (
    <AbsoluteFill className={className} style={{ overflow: "hidden", ...style }}>
      <AbsoluteFill
        style={{ transformOrigin: "0 0", transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

Stage.Floor = StageFloor;
Stage.KeyLight = StageKeyLight;
