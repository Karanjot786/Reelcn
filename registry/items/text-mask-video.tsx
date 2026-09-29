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
import { AbsoluteFill, Img } from "remotion";
import { type MotionProps, measurePx, useMotion, useTextMetrics, useTheme, useViewport } from "./core";

export type TextMaskVideoProps = MotionProps & {
  text: string;
  /** A video, or an image (png, jpg, webp, gif, avif, svg). */
  src: string;
  /** Slow zoom and drift on the footage, so a still image or a static shot keeps moving. 0 turns it off. */
  drift?: number;
  size?: number;
  font?: "heading" | "body" | "mono";
  weight?: number;
};

export function TextMaskVideo({
  text,
  src,
  drift = 1,
  size = 220,
  font = "heading",
  weight,
  ...motion
}: TextMaskVideoProps) {
  const theme = useTheme();
  const { width, height, safe, u } = useViewport();
  const m = useMotion(motion);
  const fontWeight = weight ?? theme.headingWeight;
  const gate = useTextMetrics(text, { fontFamily: theme.fonts[font], fontSize: u(size), fontWeight });
  // Shrinks a long word to fit the safe area instead of cropping it at the frame edge.
  const measured = gate.ready ? measurePx(text, `${fontWeight} ${u(size)}px ${theme.fonts[font]}`) : 0;
  const fontPx = measured > width - safe.x * 2 ? u(size) * ((width - safe.x * 2) / measured) : u(size);
  // A slow reveal on time, not the motion preset: settle finishes in a few frames, too quick for a hero shot.
  const t = Math.min(Math.max((m.frame - m.delay) / Math.max(m.enterFrames * 1.5, 1), 0), 1);
  const enter = motion.poster ? 1 : 1 - (1 - t) ** 3;
  const time = m.frame / m.fps;
  const isImage = /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(src);
  // Per-instance, not a literal constant: two <TextMaskVideo> calls in the same template must not
  // collide on the same SVG mask id (same fix as whip-pan's filter id).
  const maskId = `text-mask-video-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: gate.ready ? enter * (1 - m.exit) : 0 }}>
      <svg aria-hidden="true" width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <rect x={0} y={0} width={width} height={height} fill="black" />
            <text
              // Pixel coordinates, not "50%"/"50%": percentages inside a <mask> resolve against the
              // referencing <svg>'s own width/height, which is 0×0 here (spike confirmed a near-black
              // render with percentages, text collapsed to the top-left corner).
              x={width / 2}
              y={height / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fontFamily={theme.fonts[font]}
              fontSize={fontPx}
              fontWeight={fontWeight}
              fill="white"
              // Settles down from slightly large as it enters.
              style={{ transformOrigin: `${width / 2}px ${height / 2}px`, scale: String(1.3 - 0.3 * enter) }}
            >
              {text}
            </text>
          </mask>
        </defs>
      </svg>
      <AbsoluteFill style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}>
        <AbsoluteFill
          style={{
            scale: String(1 + 0.08 * drift + 0.02 * drift * Math.sin(time * 0.6)),
            translate: `${Math.sin(time * 0.4) * 1.5 * drift}% ${Math.cos(time * 0.3) * 1 * drift}%`,
          }}
        >
          {isImage ? (
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Video src={src} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
