// Renders the short looping clips the docs sidebar plays on hover: one per registry item (its first 16:9 demo).
// Run: node scripts/previews.ts   (writes apps/www/public/previews/*.webm; commit the result)
// A pre-rendered clip starts instantly; mounting a live Player per hover does not.
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia } from "@remotion/renderer";

const OUT = "apps/www/public/previews";
// ponytail: templates run up to ~24s; 5s is plenty for a hover peek and keeps each clip small.
const MAX_FRAMES = 150;

const registry = JSON.parse(readFileSync("registry.json", "utf8")) as {
  items: { name: string; categories: string[] }[];
};

// Overwrite in place (no upfront wipe), so a running dev site keeps its clips mid-render.
mkdirSync(OUT, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("apps/studio/src/index.ts") });
const browser = await openBrowser("chrome");
const all = await getCompositions(serveUrl, { puppeteerInstance: browser });
const demos = all
  .filter((composition) => composition.id.endsWith("-16x9") && !composition.id.startsWith("sheet-"))
  .map((composition) => ({ composition, base: composition.id.slice(0, -"-16x9".length) }));

// Same pick as apps/www/lib/demos.ts `firstDemo`: the item's own id, or the first `<name>-<variant>`.
const jobs = registry.items
  .filter((item) => !item.categories.includes("lib"))
  .map((item) => demos.find(({ base }) => base === item.name || base.startsWith(`${item.name}-`)))
  .filter((demo) => demo !== undefined);

const failed: string[] = [];
try {
  for (const { composition, base } of jobs) {
    const output = path.join(OUT, `${base}.webm`);
    // One broken demo must not stop the other clips; the run still fails at the end.
    try {
      await renderMedia({
        composition,
        serveUrl,
        codec: "vp9",
        crf: 24,
        muted: true,
        // 768x432: sharp at the card's ~424px, and even dimensions (odd heights break some decoders).
        scale: 0.4,
        // Remotion's default is full-range color, which Chrome decodes as one frozen frame; bt709 is TV range.
        colorSpace: "bt709",
        frameRange: [0, Math.min(composition.durationInFrames, MAX_FRAMES) - 1],
        outputLocation: output,
        puppeteerInstance: browser,
      });
      console.log(`ok   ${output}`);
    } catch (error) {
      failed.push(base);
      console.error(`FAIL ${output}: ${(error as Error).message}`);
    }
  }
} finally {
  await browser.close({ silent: true });
}

// Drop clips for demos that no longer exist.
const keep = new Set(jobs.map(({ base }) => `${base}.webm`));
for (const file of readdirSync(OUT)) if (!keep.has(file)) rmSync(path.join(OUT, file));

console.log(`${jobs.length - failed.length} previews in ${OUT}`);
if (failed.length > 0) {
  console.error(`${failed.length} failed: ${failed.join(", ")}`);
  process.exitCode = 1;
}
