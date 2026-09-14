// One-off local capture for Phase 2's demo screenshots. Run: `pnpm site` in one terminal, then in
// another: `node scripts/capture-screenshots.ts`.
//
// DEVIATION (user-approved): the plan's original version of this script used @remotion/renderer's
// `openBrowser().newPage()` + `setContent()`/`screenshot()` — that API doesn't exist on the installed
// @remotion/renderer version (`newPage()` throws "Cannot destructure property 'context' of 'undefined'").
// This version shells out to a headless Chrome binary's own `--screenshot` CLI flag instead — no new
// npm dependency, no runtime network fetch from any item (the resulting files are committed and
// imported locally, per CONTRIBUTING.md). Binary resolution prefers the chrome-headless-shell Remotion
// already downloads under node_modules/.remotion; that binary has no one-shot CLI `--screenshot` mode
// (it hangs waiting for a CDP connection even on `--version`), so this falls back to system Chrome,
// which supports `--headless --screenshot=<file> --window-size=W,H` directly.
//
// Chrome's `--screenshot` flag always writes PNG regardless of the output extension, so each capture
// is converted to .webp afterward with `cwebp` (part of libwebp, already on this machine — the same
// "fall back to a system tool Remotion doesn't bundle" pattern scripts/demo-audio.ts uses for ffmpeg).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const OUT = "registry/assets/screenshots";
// staticFile() resolves against each app's own public/ dir (see CLIP in story-samples.ts and the
// beat.mp3/voice.mp3/clip.mp4 pattern in scripts/demo-audio.ts) — registry/assets is not exposed to
// either app's bundler, so the committed screenshots are mirrored into both public dirs under the
// same reelcn-demo/ convention the other demo media already uses.
const STUDIO_PUB = "apps/studio/public/reelcn-demo/screenshots";
const WWW_PUB = "apps/www/public/reelcn-demo/screenshots";
mkdirSync(OUT, { recursive: true });
mkdirSync(STUDIO_PUB, { recursive: true });
mkdirSync(WWW_PUB, { recursive: true });

function resolveChrome(): string {
  const headlessShell = path.resolve(
    "node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  );
  // chrome-headless-shell has no one-shot `--screenshot` CLI mode (verified: it hangs waiting for a
  // CDP client even on `--version`), so it is skipped in favor of system Chrome below. Kept as a
  // documented first choice per the approved deviation, in case a future version adds that mode.
  if (existsSync(headlessShell)) {
    console.warn("chrome-headless-shell found but has no one-shot --screenshot mode; using system Chrome instead");
  }
  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(systemChrome)) return systemChrome;
  throw new Error("No usable Chrome binary found (checked chrome-headless-shell and system Google Chrome).");
}

const chrome = resolveChrome();
const tmp = mkdtempSync(path.join(tmpdir(), "reelcn-capture-"));

function capture(
  name: string,
  url: string,
  width: number,
  height: number,
  opts: { deviceScaleFactor?: number; virtualTimeBudgetMs?: number } = {},
) {
  const scale = opts.deviceScaleFactor ?? 2;
  const png = path.join(tmp, `${name}.png`);
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      `--screenshot=${png}`,
      `--window-size=${width},${height}`,
      "--hide-scrollbars",
      `--force-device-scale-factor=${scale}`,
      `--virtual-time-budget=${opts.virtualTimeBudgetMs ?? 2000}`,
      url,
    ],
    { stdio: "ignore" },
  );
  const webp = path.join(OUT, `${name}.webp`);
  execFileSync("cwebp", ["-q", "82", png, "-o", webp], { stdio: "ignore" });
  for (const pubDir of [STUDIO_PUB, WWW_PUB]) {
    execFileSync("cp", [webp, path.join(pubDir, `${name}.webp`)]);
  }
  console.log(`ok   ${webp} (mirrored into ${STUDIO_PUB} and ${WWW_PUB})`);
}

// 1. Our own site (rule K1: a real product we own, zero rights risk).
capture("reelcn-docs", "http://localhost:3000", 1600, 1000);

// 2. Fictional-but-specific mockup (rule K1/K2): full density, real chrome, no lorem/Acme/emoji.
const analyticsHtml = path.join(tmp, "fictional-analytics.html");
writeFileSync(
  analyticsHtml,
  `
  <div style="width:1600px;height:1000px;font-family:system-ui;background:#fff;display:flex">
    <div style="width:220px;background:#121417;color:#fff;padding:24px;display:flex;flex-direction:column;gap:16px">
      <div style="font-weight:700;font-size:20px">Northwind Analytics</div>
      <div style="opacity:.7">Overview</div><div style="opacity:.7">Retention</div><div style="opacity:.7">Revenue</div>
    </div>
    <div style="flex:1;padding:32px;display:flex;flex-direction:column;gap:20px">
      <div style="font-size:28px;font-weight:700;color:#121417">Weekly active teams</div>
      <div style="display:flex;gap:16px">
        <div style="flex:1;background:#EEF0F2;border-radius:12px;padding:20px"><div style="font-size:13px;color:#5C636E">MRR</div><div style="font-size:32px;font-weight:700">$48,210</div></div>
        <div style="flex:1;background:#EEF0F2;border-radius:12px;padding:20px"><div style="font-size:13px;color:#5C636E">Churn</div><div style="font-size:32px;font-weight:700">2.4%</div></div>
        <div style="flex:1;background:#EEF0F2;border-radius:12px;padding:20px"><div style="font-size:13px;color:#5C636E">NPS</div><div style="font-size:32px;font-weight:700">61</div></div>
      </div>
      <div style="flex:1;background:#EEF0F2;border-radius:12px"></div>
    </div>
  </div>
`,
);
capture("fictional-analytics", `file://${analyticsHtml}`, 1600, 1000);

// 3. Fictional-but-specific mockup, mobile feed.
const feedHtml = path.join(tmp, "fictional-mobile-feed.html");
writeFileSync(
  feedHtml,
  `
  <div style="width:900px;height:1950px;font-family:system-ui;background:#F4F4F1;padding:28px;box-sizing:border-box">
    <div style="font-size:24px;font-weight:800;margin-bottom:20px">Riverside</div>
    ${["Maya Ortiz - 12 min ago", "Devon Cole - 41 min ago", "Priya Shah - 2 hr ago"]
      .map(
        (row) =>
          `<div style="background:#fff;border-radius:16px;padding:18px;margin-bottom:14px;display:flex;gap:14px;align-items:center">
            <div style="width:44px;height:44px;border-radius:50%;background:#E4002B"></div>
            <div><div style="font-weight:600">${row}</div><div style="color:#8a8a8a;font-size:13px">Shared a new recording</div></div>
          </div>`,
      )
      .join("")}
  </div>
`,
);
capture("fictional-mobile-feed", `file://${feedHtml}`, 900, 1950);

rmSync(tmp, { recursive: true, force: true });
console.log("3 screenshots written to", OUT, "(and mirrored into apps/studio and apps/www public dirs)");
