// Usage:
//   node scripts/stills.ts smoke [filter]                 render 3 frames of every demo composition
//   node scripts/stills.ts sheets [filter] [--theme=neon]  render the 6-frame contact sheets
import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const mode = positional[0] ?? "sheets";
const filter = positional[1] ?? "";
const theme = args.find((arg) => arg.startsWith("--theme="))?.slice("--theme=".length);

if (mode !== "smoke" && mode !== "sheets") {
  throw new Error(`mode must be "smoke" or "sheets", got "${mode}"`);
}

const outDir = path.join("out", mode);
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("apps/studio/src/index.ts") });
const browser = await openBrowser("chrome");
const all = await getCompositions(serveUrl, { puppeteerInstance: browser });

const wanted = all.filter((composition) => {
  const isSheet = composition.id.startsWith("sheet-");
  if (mode === "sheets" ? !isSheet : isSheet || composition.id === "self-test") return false;
  return composition.id.includes(filter);
});

let failures = 0;
for (const composition of wanted) {
  const frames =
    mode === "sheets"
      ? [0]
      : [...new Set([0, Math.floor(composition.durationInFrames / 2), composition.durationInFrames - 1])];
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
      console.log(`ok   ${output}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${composition.id} @ frame ${frame}: ${(error as Error).message}`);
    }
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
