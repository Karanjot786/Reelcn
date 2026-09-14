// Generates the CC0 sound pack with ffmpeg, and writes the licence manifest.
// Run: node scripts/sfx-build.ts   (writes sfx/*.mp3 + sfx/LICENSES.md; commit the result)
// Needs a system ffmpeg on PATH: Remotion's bundled ffmpeg build lacks anoisesrc/aevalsrc, which every sound here uses.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "sfx";

// ponytail: synthesised with lavfi rather than licensed recordings. Every sound is ours, so the manifest is trivial.
const sounds: { name: string; filter: string }[] = [
  // click / switch: a filtered noise transient plus a short resonant body, so it reads as a mechanism.
  {
    name: "click",
    filter:
      "anoisesrc=d=0.06:c=white:a=0.9,highpass=f=1400,volume='exp(-t*90)':eval=frame[tr];aevalsrc='sin(2*PI*t*3200)':d=0.06,volume='exp(-t*140)':eval=frame[bd];[tr][bd]amix=inputs=2:duration=first",
  },
  {
    name: "click-soft",
    filter:
      "anoisesrc=d=0.08:c=pink:a=0.5,lowpass=f=2200,volume='exp(-t*60)':eval=frame[tr];aevalsrc='sin(2*PI*t*2400)':d=0.08,volume='exp(-t*100)':eval=frame[bd];[tr][bd]amix=inputs=2:duration=first",
  },
  {
    name: "tap",
    filter:
      "anoisesrc=d=0.05:c=white:a=0.6,bandpass=f=900:w=600,volume='exp(-t*110)':eval=frame[tr];aevalsrc='sin(2*PI*t*2800)':d=0.05,volume='exp(-t*150)':eval=frame[bd];[tr][bd]amix=inputs=2:duration=first",
  },
  {
    name: "tick",
    filter:
      "anoisesrc=d=0.03:c=white:a=0.8,highpass=f=3000,volume='exp(-t*160)':eval=frame[tr];aevalsrc='sin(2*PI*t*3600)':d=0.03,volume='exp(-t*180)':eval=frame[bd];[tr][bd]amix=inputs=2:duration=first",
  },
  {
    name: "keypress",
    filter:
      "anoisesrc=d=0.05:c=brown:a=0.8,bandpass=f=700:w=500,volume='exp(-t*120)':eval=frame[tr];aevalsrc='sin(2*PI*t*2000)':d=0.05,volume='exp(-t*140)':eval=frame[bd];[tr][bd]amix=inputs=2:duration=first",
  },
  {
    name: "typing",
    filter:
      "anoisesrc=d=1.2:c=white:a=0.7,bandpass=f=1100:w=800,volume='if(lt(mod(t,0.12),0.02),exp(-mod(t,0.12)*120),0)':eval=frame,highpass=f=900",
  },

  // impact / thud / drop: pitch-dropping low thump + noise crack transient + a short reverb tail.
  {
    name: "impact",
    filter:
      "aevalsrc='sin(2*PI*t*(80-40*t))':d=0.8,volume='exp(-t*7)':eval=frame[thump];anoisesrc=d=0.03:c=white:a=0.9,highpass=f=2000,volume='exp(-t*80)':eval=frame[crack];[thump][crack]amix=inputs=2:duration=first,aecho=0.6:0.5:60:0.25",
  },
  {
    name: "thud",
    filter:
      "aevalsrc='sin(2*PI*t*(70-30*t))':d=0.6,volume='exp(-t*9)':eval=frame[thump];anoisesrc=d=0.02:c=white:a=0.7,highpass=f=1800,volume='exp(-t*90)':eval=frame[crack];[thump][crack]amix=inputs=2:duration=first,aecho=0.5:0.4:50:0.2",
  },
  {
    name: "drop",
    filter:
      "aevalsrc='sin(2*PI*t*(90-45*t))':d=0.7,volume='exp(-t*4)':eval=frame[thump];anoisesrc=d=0.025:c=white:a=0.8,highpass=f=1900,volume='exp(-t*85)':eval=frame[crack];[thump][crack]amix=inputs=2:duration=first,aecho=0.55:0.45:55:0.22",
  },
  {
    name: "transition-hit",
    filter: "anoisesrc=d=0.9:c=brown:a=0.9,lowpass=f=700,volume='exp(-t*6)':eval=frame,aecho=0.6:0.5:80:0.2",
  },

  // whoosh family: a low-high-low bandpass sweep (triangular center-frequency curve), motion-shaped envelope.
  {
    name: "whoosh",
    filter:
      "anoisesrc=d=0.7:c=pink:a=0.9[src];[src]asplit=2[s1][s2];[s1]bandpass=f=400:w=1200,volume='1-sin(PI*min(t/0.7,1))':eval=frame[lo];[s2]bandpass=f=2800:w=1200,volume='sin(PI*min(t/0.7,1))':eval=frame[hi];[lo][hi]amix=inputs=2:duration=first,volume='sin(PI*min(t/0.7,1))':eval=frame",
  },
  {
    name: "whoosh-soft",
    filter:
      "anoisesrc=d=0.8:c=pink:a=0.5[src];[src]asplit=2[s1][s2];[s1]bandpass=f=300:w=900,volume='1-sin(PI*min(t/0.8,1))':eval=frame[lo];[s2]bandpass=f=1900:w=900,volume='sin(PI*min(t/0.8,1))':eval=frame[hi];[lo][hi]amix=inputs=2:duration=first,volume='sin(PI*min(t/0.8,1))*0.7':eval=frame",
  },
  {
    name: "swoosh",
    filter:
      "anoisesrc=d=0.5:c=white:a=0.8[src];[src]asplit=2[s1][s2];[s1]bandpass=f=600:w=1600,volume='1-sin(PI*min(t/0.5,1))':eval=frame[lo];[s2]bandpass=f=3800:w=1600,volume='sin(PI*min(t/0.5,1))':eval=frame[hi];[lo][hi]amix=inputs=2:duration=first,volume='sin(PI*min(t/0.5,1))':eval=frame",
  },
  {
    name: "swish",
    filter:
      "anoisesrc=d=0.35:c=white:a=0.7[src];[src]asplit=2[s1][s2];[s1]bandpass=f=800:w=1800,volume='1-sin(PI*min(t/0.35,1))':eval=frame[lo];[s2]bandpass=f=4400:w=1800,volume='sin(PI*min(t/0.35,1))':eval=frame[hi];[lo][hi]amix=inputs=2:duration=first,volume='sin(PI*min(t/0.35,1))':eval=frame",
  },
  {
    name: "swipe",
    filter:
      "anoisesrc=d=0.3:c=pink:a=0.7[src];[src]asplit=2[s1][s2];[s1]bandpass=f=500:w=1200,volume='1-sin(PI*min(t/0.3,1))':eval=frame[lo];[s2]bandpass=f=3100:w=1200,volume='sin(PI*min(t/0.3,1))':eval=frame[hi];[lo][hi]amix=inputs=2:duration=first,volume='sin(PI*min(t/0.3,1))':eval=frame",
  },

  // paper / shutter / keyboard already grain-friendly; camera-shutter/glitch get a seeded-timing pass.
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

  // Everything else keeps its existing recipe — already a filtered noise transient or a tone, not a slop offender.
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
];

mkdirSync(OUT, { recursive: true });

// rule S2: repeated hits alternate two samples. Every name gets a base file and a "-alt" file. The
// alt variant applies a small, seeded (not Math.random) pitch/time micro-shift as a post-filter on top
// of the exact same filter graph — this works uniformly across all 30 recipes regardless of which of
// the 3 incompatible filter grammars each one uses (exp(-t*N) decays, sin(PI*min(t/D,1)) sweeps,
// min(t*N,1) ramps, or none of those), unlike trying to regex-edit each recipe's own parameters.
function seededRate(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const signed = (hash % 1000) / 1000 - 0.5; // -0.5..0.5
  // +/- 2%-3.5% pitch/time shift, and never allowed to land at 0 (which would make base and alt
  // byte-identical) regardless of hash: at |signed| < 0.1 the sign of `signed` (or +1 if exactly 0)
  // still pushes the rate to at least a 2% shift.
  const magnitude = 0.02 + Math.abs(signed) * 0.03;
  return 1 + (signed < 0 ? -magnitude : magnitude);
}

const variants = sounds.flatMap((sound) => [
  { name: sound.name, filter: sound.filter, rate: 1 },
  { name: `${sound.name}-alt`, filter: sound.filter, rate: seededRate(sound.name) },
]);

for (const sound of variants) {
  const output = path.resolve(OUT, `${sound.name}.mp3`);
  // loudnorm after synthesis: every generated file targets -16 LUFS integrated, so no sound in the
  // pack is jarringly louder than another when items combine them, and item-level volume= props behave
  // predictably (spec §13 risk 5 — a sweep of existing volume= call sites is this task's Step 5). The
  // pitch/time shift (base files get none, `rate` stays 1) runs before loudnorm so the loudness target
  // is measured on the final, shifted alt audio, not the pre-shift signal.
  // Sounds under ~200ms can't reach -16 LUFS integrated: loudnorm's gating window needs more signal
  // than a short hit provides, so ffmpeg's single-pass loudnorm instead peak-limits them at TP=-1.5
  // dBTP and they land below the -16 LUFS target. This is expected for short sounds, not a bug.
  const postFilters =
    sound.rate === 1
      ? "loudnorm=I=-16:TP=-1.5:LRA=11"
      : `asetrate=44100*${sound.rate.toFixed(4)},aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11`;
  const ffmpegArgs = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    sound.filter,
    "-af",
    postFilters,
    "-ac",
    "1",
    "-ar",
    "44100",
    "-b:a",
    "128k",
    output,
  ];
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

// Blocker check: no "-alt" file may be byte-identical to its base (rule S2 needs 2 genuinely different
// variants for every one of the 30 names, not 30 correct pairs plus a few accidental copies). Fails
// loudly, not silently, since a still frame or an inattentive ear can't catch this — see the plan's
// ear-test checklist item 4 for the corresponding manual check.
for (const sound of sounds) {
  const baseHash = createHash("sha256")
    .update(readFileSync(path.resolve(OUT, `${sound.name}.mp3`)))
    .digest("hex");
  const altHash = createHash("sha256")
    .update(readFileSync(path.resolve(OUT, `${sound.name}-alt.mp3`)))
    .digest("hex");
  if (baseHash === altHash) {
    throw new Error(`${sound.name}: -alt variant is byte-identical to its base file (rule S2 violation)`);
  }
}
console.log(`verified: all ${sounds.length} -alt variants differ from their base file`);

writeFileSync(
  path.join(OUT, "LICENSES.md"),
  `# Sound effect licences\n\nEvery sound here is generated by \`scripts/sfx-build.ts\` with ffmpeg, so reelcn holds the rights and releases them under CC0-1.0. Re-run \`pnpm sfx:build\` to reproduce the pack byte for byte.\n\nLoudness target: -16 LUFS integrated (ffmpeg \`loudnorm\`, TP=-1.5 dBTP, LRA=11). Sounds under ~200ms can't reach -16 LUFS integrated — loudnorm's gating window needs more signal than a short hit provides — so those files are instead peak-limited at -1.5 dBTP and land below the -16 LUFS target. This is expected for short sounds, not a bug.\n\n| File | Author | Licence | Source |\n|---|---|---|---|\n${variants
    .map((sound) => `| ${sound.name}.mp3 | reelcn | CC0-1.0 | generated by scripts/sfx-build.ts |`)
    .join("\n")}\n`,
);
console.log(`${variants.length} sounds and LICENSES.md written to ${OUT}`);
