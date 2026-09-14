/**
 * @title Text Mask Video
 * @category text
 * @description Type acts as a window onto footage: the glyphs are the only place the video or image beneath shows through.
 * @duration data-driven
 * @use A headline that IS the footage, not a caption on top of it
 * @use Brand reveals where the type and the shot are the same idea
 * @tags mask, video, type, window, svg
 * @example
 * <TextMaskVideo text="MOTION" src={staticFile("b-roll.mp4")} />
 */
import { Video } from "@remotion/media";
import { useId } from "react";
import { AbsoluteFill } from "remotion";
import { type MotionProps, useMotion, useTheme, useViewport } from "./core";

export type TextMaskVideoProps = MotionProps & {
  text: string;
  src: string;
  size?: number;
  font?: "heading" | "body" | "mono";
  weight?: number;
};

export function TextMaskVideo({ text, src, size = 220, font = "heading", weight, ...motion }: TextMaskVideoProps) {
  const theme = useTheme();
  const { width, height, u } = useViewport();
  const m = useMotion(motion);
  const fontPx = u(size);
  // Per-instance, not a literal constant: two <TextMaskVideo> calls in the same template must not
  // collide on the same SVG mask id (same fix as whip-pan's filter id).
  const maskId = `text-mask-video-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - m.exit }}>
      <svg aria-hidden="true" width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <rect x={0} y={0} width={width} height={height} fill="black" />
            <text
              // Pixel coordinates, not "50%"/"50%": percentages inside a <mask> resolve against the
              // referencing <svg>'s own width/height, which is 0×0 here (spike confirmed a near-black
              // render with percentages — text collapsed to the top-left corner).
              x={width / 2}
              y={height / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fontFamily={theme.fonts[font]}
              fontSize={fontPx}
              fontWeight={weight ?? theme.headingWeight}
              fill="white"
            >
              {text}
            </text>
          </mask>
        </defs>
      </svg>
      <AbsoluteFill style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}>
        <Video src={src} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
