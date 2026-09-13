// Generates the CC0 sound pack with ffmpeg, and writes the licence manifest.
// Run: node scripts/sfx-build.ts   (writes sfx/*.mp3 + sfx/LICENSES.md; commit the result)
// Needs a system ffmpeg on PATH: Remotion's bundled ffmpeg build lacks anoisesrc/aevalsrc, which every sound here uses.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "sfx";

// ponytail: synthesised with lavfi rather than licensed recordings. Every sound is ours, so the manifest is trivial.
const sounds: { name: string; filter: string }[] = [
  { name: "click", filter: "anoisesrc=d=0.06:c=white:a=0.9,highpass=f=1400,volume='exp(-t*90)':eval=frame" },
  { name: "click-soft", filter: "anoisesrc=d=0.08:c=pink:a=0.5,lowpass=f=2200,volume='exp(-t*60)':eval=frame" },
  { name: "tap", filter: "anoisesrc=d=0.05:c=white:a=0.6,bandpass=f=900:w=600,volume='exp(-t*110)':eval=frame" },
  { name: "tick", filter: "anoisesrc=d=0.03:c=white:a=0.8,highpass=f=3000,volume='exp(-t*160)':eval=frame" },
  { name: "keypress", filter: "anoisesrc=d=0.05:c=brown:a=0.8,bandpass=f=700:w=500,volume='exp(-t*120)':eval=frame" },
  {
    name: "typing",
    filter:
      "anoisesrc=d=1.2:c=white:a=0.7,bandpass=f=1100:w=800,volume='if(lt(mod(t,0.12),0.02),exp(-mod(t,0.12)*120),0)':eval=frame",
  },
  { name: "pop", filter: "aevalsrc='sin(2*PI*t*(520+180*t))':d=0.16,volume='exp(-t*26)':eval=frame" },
  { name: "pop-high", filter: "aevalsrc='sin(2*PI*t*(880+260*t))':d=0.14,volume='exp(-t*30)':eval=frame" },
  { name: "bubble", filter: "aevalsrc='sin(2*PI*t*(300+900*t))':d=0.26,lowpass=f=2400,volume='exp(-t*14)':eval=frame" },
  { name: "ding", filter: "aevalsrc='0.7*sin(2*PI*t*1760)+0.3*sin(2*PI*t*3520)':d=0.9,volume='exp(-t*5)':eval=frame" },
  { name: "bell", filter: "aevalsrc='0.6*sin(2*PI*t*880)+0.4*sin(2*PI*t*1320)':d=1.4,volume='exp(-t*3)':eval=frame" },
  {
    name: "chime",
    filter:
      "aevalsrc='0.5*sin(2*PI*t*1046)+0.3*sin(2*PI*t*1568)+0.2*sin(2*PI*t*2093)':d=1.2,volume='exp(-t*4)':eval=frame",
  },
  { name: "sparkle", filter: "aevalsrc='sin(2*PI*t*2400)':d=0.6,tremolo=f=18:d=0.8,volume='exp(-t*7)':eval=frame" },
  {
    name: "notification",
    filter: "aevalsrc='sin(2*PI*t*if(lt(t,0.16),880,1320))':d=0.5,volume='exp(-t*6)':eval=frame",
  },
  { name: "coin", filter: "aevalsrc='sin(2*PI*t*if(lt(t,0.08),988,1319))':d=0.38,volume='exp(-t*9)':eval=frame" },
  { name: "success", filter: "aevalsrc='sin(2*PI*t*(523+440*t))':d=0.55,volume='0.9*exp(-t*4)':eval=frame" },
  { name: "error", filter: "aevalsrc='sin(2*PI*t*(420-160*t))':d=0.5,volume='0.9*exp(-t*5)':eval=frame" },
  { name: "rise", filter: "aevalsrc='sin(2*PI*t*(200+900*t*t))':d=1.0,volume='min(t*3,1)*0.8':eval=frame" },
  { name: "riser-short", filter: "aevalsrc='sin(2*PI*t*(260+1500*t*t))':d=0.6,volume='min(t*4,1)*0.8':eval=frame" },
  { name: "drop", filter: "aevalsrc='sin(2*PI*t*(900-700*t))':d=0.7,volume='exp(-t*4)':eval=frame" },
  { name: "impact", filter: "aevalsrc='sin(2*PI*t*(90-40*t))':d=0.8,volume='exp(-t*7)':eval=frame" },
  { name: "thud", filter: "aevalsrc='sin(2*PI*t*55)':d=0.6,volume='exp(-t*9)':eval=frame" },
  { name: "transition-hit", filter: "anoisesrc=d=0.9:c=brown:a=0.9,lowpass=f=700,volume='exp(-t*6)':eval=frame" },
  {
    name: "whoosh",
    filter: "anoisesrc=d=0.7:c=pink:a=0.9,bandpass=f=1200:w=1400,volume='sin(PI*min(t/0.7,1))':eval=frame",
  },
  {
    name: "whoosh-soft",
    filter: "anoisesrc=d=0.8:c=pink:a=0.5,bandpass=f=800:w=900,volume='sin(PI*min(t/0.8,1))*0.7':eval=frame",
  },
  {
    name: "swoosh",
    filter: "anoisesrc=d=0.5:c=white:a=0.8,bandpass=f=2000:w=1800,volume='sin(PI*min(t/0.5,1))':eval=frame",
  },
  { name: "swish", filter: "anoisesrc=d=0.35:c=white:a=0.7,highpass=f=1800,volume='sin(PI*min(t/0.35,1))':eval=frame" },
  {
    name: "swipe",
    filter: "anoisesrc=d=0.3:c=pink:a=0.7,bandpass=f=1600:w=1200,volume='sin(PI*min(t/0.3,1))':eval=frame",
  },
  {
    name: "glitch",
    filter:
      "anoisesrc=d=0.35:c=white:a=0.9,bandpass=f=1500:w=2500,volume='if(lt(mod(t,0.05),0.025),1,0.05)':eval=frame",
  },
  {
    name: "camera-shutter",
    filter:
      "anoisesrc=d=0.3:c=white:a=0.9,highpass=f=900,volume='if(lt(t,0.03),exp(-t*60),if(lt(abs(t-0.13),0.03),exp(-abs(t-0.13)*60),0))':eval=frame",
  },
];

mkdirSync(OUT, { recursive: true });
for (const sound of sounds) {
  const output = path.resolve(OUT, `${sound.name}.mp3`);
  const ffmpegArgs = ["-y", "-f", "lavfi", "-i", sound.filter, "-ac", "1", "-ar", "44100", "-b:a", "128k", output];
  try {
    // cwd: apps/studio has remotion as a direct dependency, so npx resolves its bundled
    // ffmpeg from the local node_modules/.bin without a registry lookup for "remotion"
    // (root has no direct remotion dep). Mirrors scripts/demo-audio.ts.
    execFileSync("npx", ["remotion", "ffmpeg", ...ffmpegArgs], { stdio: "inherit", cwd: path.resolve("apps/studio") });
  } catch (err) {
    // Remotion's bundled ffmpeg is built without lavfi noise/eval sources (no anoisesrc,
    // no aevalsrc), which every sound here needs. Fall back to the system ffmpeg with
    // identical args.
    console.warn(`remotion ffmpeg failed for ${sound.name}, falling back to system ffmpeg: ${(err as Error).message}`);
    try {
      execFileSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    } catch (fallbackErr) {
      if ((fallbackErr as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          "sfx:build needs ffmpeg on PATH (Remotion's bundled ffmpeg lacks anoisesrc/aevalsrc) — install it, e.g. brew install ffmpeg",
        );
      }
      throw fallbackErr;
    }
  }
  console.log(`ok   ${output}`);
}

writeFileSync(
  path.join(OUT, "LICENSES.md"),
  `# Sound effect licences\n\nEvery sound here is generated by \`scripts/sfx-build.ts\` with ffmpeg, so reelcn holds the rights and releases them under CC0-1.0. Re-run \`pnpm sfx:build\` to reproduce the pack byte for byte.\n\n| File | Author | Licence | Source |\n|---|---|---|---|\n${sounds
    .map((sound) => `| ${sound.name}.mp3 | reelcn | CC0-1.0 | generated by scripts/sfx-build.ts |`)
    .join("\n")}\n`,
);
console.log(`${sounds.length} sounds and LICENSES.md written to ${OUT}`);
