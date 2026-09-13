// biome-ignore-all lint/performance/noImgElement: Satori renders a plain img; next/image can't run here
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { GREASE_CIRCLE_D } from "@/components/grease";

export const alt = "reelcn: Every frame, already designed.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const title = "Every frame, already designed.";

// Light-mode tokens (site spec §3). Satori has no CSS variables.
const paper = "#e4e5e1";
const ink = "#1b1d1c";
const film = "#0a0a0a";
const sprocket = "#c9cbc6";
const grease = "#d7262f";

/**
 * Satori reads TTF/OTF only, and no variable axes. Google Fonts serves non-browser clients a static TTF instance, subset
 * to `text`. It's fetched once at build time (next/font already needs Google Fonts during the build).
 */
async function archivoCondensed(text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75,800&text=${encodeURIComponent(text)}`,
    { cache: "force-cache" },
  ).then((res) => res.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("opengraph-image: Google Fonts returned no TTF for Archivo");
  return fetch(url, { cache: "force-cache" }).then((res) => res.arrayBuffer());
}

const sprockets = {
  height: 10,
  backgroundImage: `repeating-linear-gradient(90deg, ${sprocket} 0 14px, transparent 14px 32px)`,
};

export default async function Image() {
  // process.cwd() is apps/www under `next build`.
  const frame = await readFile(path.join(process.cwd(), "public/thumbs/hero-t4.jpg"), "base64");
  const font = await archivoCondensed(`reelcn${title}`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 72px",
        background: paper,
        color: ink,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: 470 }}>
        <div style={{ fontSize: 30 }}>reelcn</div>
        <div style={{ fontSize: 104, lineHeight: 0.9 }}>{title}</div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          borderRadius: 4,
          background: film,
          transform: "rotate(-1.5deg)",
        }}
      >
        <div style={sprockets} />
        <img src={`data:image/jpeg;base64,${frame}`} alt="" width={480} height={270} />
        <div style={sprockets} />
        {/* The keeper circle, at the hero's proportions: 131% × 167% of the frame, offset -15% / -31%. */}
        <svg
          width={629}
          height={451}
          viewBox="0 0 210 150"
          fill="none"
          aria-hidden
          style={{ position: "absolute", left: -56, top: -46 }}
        >
          <path d={GREASE_CIRCLE_D} stroke={grease} strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Archivo", data: font, weight: 800, style: "normal" }] },
  );
}
