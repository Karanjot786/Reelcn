// Renders the stills the docs site shows: one per demo, the landing hero strips, the format trio and one frame per theme.
// Run: node scripts/thumbs.ts   (writes apps/www/public/thumbs/*.jpg, demos.json and durations.json; commit the result)
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { themeNamesFromSource } from "./build-registry.ts";

const OUT = "apps/www/public/thumbs";
type Job = { id: string; out: string; frame?: number; theme?: string };
const FORMATS = ["16x9", "9x16", "1x1"] as const;

const fixed: Job[] = [
  ...[1, 10, 19, 28].map((frame, i) => ({ id: "text-reveal-blur-16x9", out: `hero-t${i + 1}`, frame })),
  ...[1, 12, 23, 34, 45, 55].map((frame, i) => ({ id: "lower-third-bar-9x16", out: `hero-l${i + 1}`, frame })),
  ...["16x9", "9x16", "1x1"].map((format) => ({ id: `lower-third-card-${format}`, out: `fmt-${format}` })),
  ...themeNamesFromSource().map((theme) => ({ id: "text-reveal-blur-16x9", out: `theme-${theme}`, frame: 28, theme })),
  { id: "product-launch-16x9", out: "hero-launch", frame: 40 },
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("apps/studio/src/index.ts") });
const browser = await openBrowser("chrome");
const all = await getCompositions(serveUrl, { puppeteerInstance: browser });
const byId = new Map(all.map((composition) => [composition.id, composition]));
const perDemo: Job[] = all
  .filter((composition) => composition.id.endsWith("-16x9") && !composition.id.startsWith("sheet-"))
  .flatMap((composition) => {
    const base = composition.id.slice(0, -"-16x9".length);
    return FORMATS.filter((format) => byId.has(`${base}-${format}`)).map((format) => ({
      id: `${base}-${format}`,
      // The existing 16:9 file keeps its bare name so lib/demos.ts's current callers don't need to change;
      // 9:16 and 1:1 land alongside it as new, distinctly-named files.
      out: format === "16x9" ? base : `${base}-${format}`,
    }));
  });

try {
  for (const job of [...perDemo, ...fixed]) {
    const composition = byId.get(job.id);
    if (!composition) throw new Error(`no composition "${job.id}"`);
    const output = path.join(OUT, `${job.out}.jpg`);
    await renderStill({
      // renderStill renders composition.props; its inputProps option only feeds calculateMetadata.
      composition: job.theme ? { ...composition, props: { ...composition.props, theme: job.theme } } : composition,
      serveUrl,
      frame:
        job.frame ??
        (composition.props.thumbFrame as number | undefined) ??
        Math.floor(composition.durationInFrames / 2),
      output,
      imageFormat: "jpeg",
      jpegQuality: 72,
      scale: 0.25,
      puppeteerInstance: browser,
    });
    console.log(`ok   ${output}`);
  }
} finally {
  await browser.close({ silent: true });
}

// `perDemo` is already in composition order (the folder walk visits categories in `demos`' group-insertion
// order, and each category's demos in file order), which is the order `lib/demos.ts` needs.
writeFileSync(
  path.join(OUT, "demos.json"),
  `${JSON.stringify(
    perDemo.map((job) => job.out),
    null,
    2,
  )}\n`,
);
console.log(`ok   ${path.join(OUT, "demos.json")}`);
// Frames per demo, for the docs sidebar's template lengths.
writeFileSync(
  path.join(OUT, "durations.json"),
  `${JSON.stringify(Object.fromEntries(perDemo.map((job) => [job.out, byId.get(job.id)?.durationInFrames])), null, 2)}\n`,
);
console.log(`ok   ${path.join(OUT, "durations.json")}`);

console.log(`${perDemo.length + fixed.length} thumbnails in ${OUT}`);
