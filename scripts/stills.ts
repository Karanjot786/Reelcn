// Usage:
//   node scripts/stills.ts smoke [filter]                 render 3 frames of every demo composition
//   node scripts/stills.ts sheets [filter] [--theme=neon]  render the 9-frame contact sheets
//   node scripts/stills.ts determinism [filter]           render 10 sampled demos twice at full size; hashes must match
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { themeNamesFromSource } from "./build-registry.ts";

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const mode = positional[0] ?? "sheets";
const filter = positional[1] ?? "";
// Comma-separated: `pnpm stills smoke product-launch,ProductLaunch` bundles once for both.
const filters = filter.split(",");
const theme = args.find((arg) => arg.startsWith("--theme="))?.slice("--theme=".length);

if (mode !== "smoke" && mode !== "sheets" && mode !== "determinism") {
  throw new Error(`mode must be "smoke", "sheets" or "determinism", got "${mode}"`);
}
const themes = themeNamesFromSource();
if (theme && !themes.includes(theme)) {
  throw new Error(`unknown --theme "${theme}" (expected one of ${themes.join(", ")})`);
}

const outDir = path.join("out", mode);
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("apps/studio/src/index.ts") });
const browser = await openBrowser("chrome");
const all = await getCompositions(serveUrl, { puppeteerInstance: browser });

// Pixel determinism (spec §15.2): 10 demos sampled evenly across the catalog, each middle frame rendered twice at
// full size. The two PNGs must hash the same. The first render's time is checked against the 3 s budget (§15.4),
// which is reported, not enforced.
if (mode === "determinism") {
  const candidates = all.filter(
    (c) => c.id.endsWith("-16x9") && !c.id.startsWith("sheet-") && filters.some((part) => c.id.includes(part)),
  );
  const step = Math.max(1, Math.floor(candidates.length / 10));
  const sample = candidates.filter((_, index) => index % step === 0).slice(0, 10);
  const report = ["| Demo | First render | Identical |", "|---|---|---|"];
  let mismatches = 0;
  for (const composition of sample) {
    const frame = Math.floor(composition.durationInFrames / 2);
    const hashes: string[] = [];
    let ms = 0;
    for (const run of ["a", "b"]) {
      const output = path.join(outDir, `${composition.id}-${run}.png`);
      const started = performance.now();
      await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser });
      if (run === "a") ms = Math.round(performance.now() - started);
      hashes.push(createHash("sha256").update(readFileSync(output)).digest("hex"));
    }
    const same = hashes[0] === hashes[1];
    if (!same) mismatches++;
    report.push(
      `| ${composition.id} | ${ms} ms${ms > 3000 ? " (over the 3 s budget)" : ""} | ${same ? "yes" : "no"} |`,
    );
    console.log(`${same ? "ok  " : "FAIL"} ${composition.id} frame ${frame}, ${ms} ms`);
  }
  await browser.close({ silent: true });
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Pixel determinism\n\n${report.join("\n")}\n`);
  }
  if (sample.length === 0) {
    console.error(`no demo compositions matched "${filter}"`);
    process.exit(1);
  }
  if (mismatches > 0) {
    console.error(`${mismatches} demo(s) rendered differently the second time`);
    process.exit(1);
  }
  console.log(`${sample.length} demos rendered identically twice`);
  process.exit(0);
}

const wanted = all.filter((composition) => {
  const isSheet = composition.id.startsWith("sheet-");
  if (mode === "sheets" ? !isSheet : isSheet || composition.id === "self-test") return false;
  return filters.some((part) => composition.id.includes(part));
});

let failures = 0;
for (const composition of wanted) {
  const frames =
    mode === "sheets"
      ? [0]
      : [...new Set([0, Math.floor(composition.durationInFrames / 2), composition.durationInFrames - 1])];
  const hashes = new Set<string>();
  let rendered = 0;
  for (const frame of frames) {
    const suffix = mode === "smoke" ? `-f${frame}` : "";
    const output = path.join(outDir, `${composition.id}${suffix}${theme ? `-${theme}` : ""}.png`);
    try {
      await renderStill({
        // renderStill renders composition.props; its inputProps option only feeds calculateMetadata.
        composition: theme ? { ...composition, props: { ...composition.props, theme } } : composition,
        serveUrl,
        frame,
        output,
        scale: 0.25,
        puppeteerInstance: browser,
      });
      hashes.add(createHash("sha256").update(readFileSync(output)).digest("hex"));
      rendered++;
      console.log(`ok   ${output}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${composition.id} @ frame ${frame}: ${(error as Error).message}`);
    }
  }
  // Identical first, middle and last frames mean the demo renders nothing, or never moves.
  if (mode === "smoke" && rendered === frames.length && frames.length > 1 && hashes.size === 1) {
    failures++;
    console.error(`FAIL ${composition.id}: frames ${frames.join(", ")} are pixel-identical — blank or static demo`);
  }
}

await browser.close({ silent: true });

if (wanted.length === 0) {
  console.error(`no compositions matched mode "${mode}" filter "${filter}"`);
  process.exit(1);
}
if (failures > 0) {
  console.error(`${failures} render(s) failed`);
  process.exit(1);
}
console.log(`${wanted.length} composition(s) rendered to ${outDir}`);
