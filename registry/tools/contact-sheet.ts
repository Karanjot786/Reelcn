/**
 * @title Contact Sheet
 * @category tools
 * @description Renders one PNG grid of evenly spaced frames from any composition, so a whole video can be reviewed in a single image.
 * @tags review, stills, contact sheet, agent
 * @example
 * node scripts/reelcn-contact-sheet.ts ProductLaunch
 * node scripts/reelcn-contact-sheet.ts Storyboard --frames 9 --props story.json --out review.png
 * node scripts/reelcn-contact-sheet.ts MyVideo --entry src/index.ts
 */
// Runs TypeScript directly, so it needs Node 22.18 or newer. Run it from your project root.
// ponytail: bundles with defaults; a project whose remotion.config.ts overrides webpack needs that override passed to bundle().
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const USAGE =
  "usage: node scripts/reelcn-contact-sheet.ts <compositionId> [--frames 6] [--props file.json] [--out sheet.png] [--entry src/index.ts]";
const SCALE = 0.25;

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const id = args[0];
const count = Number(option("frames") ?? 6);
if (!id || id.startsWith("--") || !Number.isInteger(count) || count < 1) {
  console.error(USAGE);
  process.exit(1);
}
const entry = path.resolve(option("entry") ?? "src/index.ts");
const out = path.resolve(option("out") ?? `${id}-sheet.png`);
const propsFile = option("props");
const inputProps: Record<string, unknown> = propsFile ? JSON.parse(readFileSync(propsFile, "utf8")) : {};

// The grid is itself a composition, bundled from this temporary entry. It is written next to the user's entry so
// `react` and `remotion` resolve from their node_modules, and it is plain JS so no loader has to transpile it.
const SHEET_ENTRY = `import { createElement as h } from "react";
import { AbsoluteFill, Composition, Img, registerRoot } from "remotion";

const Sheet = ({ cells, columns, width, height }) =>
  h(AbsoluteFill, { style: { background: "#1c1c1c" } },
    cells.map((cell, index) =>
      h("div", { key: index, style: { position: "absolute", left: (index % columns) * width, top: Math.floor(index / columns) * height, width, height } },
        h(Img, { src: cell.src, style: { width: "100%", height: "100%" } }),
        h("div", { style: { position: "absolute", top: 8, left: 8, padding: "2px 10px", background: "#000c", color: "#fff", font: "600 16px monospace" } }, "f" + cell.frame))));

registerRoot(() =>
  h(Composition, {
    id: "reelcn-contact-sheet", component: Sheet, fps: 30, durationInFrames: 1, width: 2, height: 2,
    defaultProps: { cells: [], columns: 1, width: 2, height: 2 },
    calculateMetadata: ({ props }) => ({ width: props.columns * props.width, height: Math.ceil(props.cells.length / props.columns) * props.height }),
  }));
`;

const sheetEntry = path.join(path.dirname(entry), ".reelcn-contact-sheet.js");
const browser = await openBrowser("chrome");
try {
  const serveUrl = await bundle({ entryPoint: entry });
  const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser });
  // Skip the first and last frame, where entrances and exits are invisible (Studio's own sheets do the same).
  const last = composition.durationInFrames - 1;
  const first = Math.min(1, last);
  const span = Math.max(last - 2, 0);
  const frames = Array.from({ length: count }, (_, i) => Math.round(first + (i * span) / Math.max(count - 1, 1)));

  const cells: { frame: number; src: string }[] = [];
  for (const frame of frames) {
    // No `output`: renderStill hands the PNG back as a buffer.
    const { buffer } = await renderStill({
      composition,
      serveUrl,
      frame,
      scale: SCALE,
      inputProps,
      puppeteerInstance: browser,
    });
    cells.push({ frame, src: `data:image/png;base64,${(buffer as Buffer).toString("base64")}` });
    console.log(`frame ${frame}`);
  }

  writeFileSync(sheetEntry, SHEET_ENTRY);
  const sheetUrl = await bundle({ entryPoint: sheetEntry });
  const sheetProps = {
    cells,
    columns: Math.ceil(Math.sqrt(count)),
    width: Math.round(composition.width * SCALE),
    height: Math.round(composition.height * SCALE),
  };
  const sheet = await selectComposition({
    serveUrl: sheetUrl,
    id: "reelcn-contact-sheet",
    inputProps: sheetProps,
    puppeteerInstance: browser,
  });
  mkdirSync(path.dirname(out), { recursive: true });
  await renderStill({
    composition: sheet,
    serveUrl: sheetUrl,
    frame: 0,
    output: out,
    inputProps: sheetProps,
    puppeteerInstance: browser,
  });
  console.log(`wrote ${path.relative(process.cwd(), out)}: ${cells.length} frames of ${id} (${frames.join(", ")})`);
} finally {
  rmSync(sheetEntry, { force: true });
  await browser.close({ silent: true });
}
