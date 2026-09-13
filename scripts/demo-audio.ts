// Generates the demo media that audio items and video scenes preview against, with the ffmpeg bundled in Remotion.
// Run: node scripts/demo-audio.ts [name…]   (writes both apps' public/reelcn-demo/*; commit the result)
// With names, only those files are written: `node scripts/demo-audio.ts clip.mp4`.
// voice.mp3 needs a system ffmpeg on PATH: Remotion's bundled ffmpeg build lacks the anoisesrc filter.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const STUDIO = "apps/studio/public/reelcn-demo";
const WWW = "apps/www/public/reelcn-demo";
const AUDIO = ["-ac", "1", "-ar", "44100", "-b:a", "96k"];

// ponytail: lavfi generators instead of licensed media. Swap in real footage only if a demo needs it.
const outputs = [
  {
    name: "beat.mp3",
    // 120bpm: a 60Hz kick every 0.5s plus a quiet 220Hz bed, so waveform and spectrum both have something to show.
    input:
      "sine=frequency=60:duration=6,volume='if(lt(mod(t,0.5),0.12),1.0,0.05)':eval=frame[kick];" +
      "sine=frequency=220:duration=6,volume=0.12[bed];" +
      "[kick][bed]amix=inputs=2:duration=first",
    args: AUDIO,
  },
  {
    name: "voice.mp3",
    // Speech-shaped: band-limited noise gated into ~4 syllables a second, with gaps between phrases.
    input:
      "anoisesrc=duration=6:color=pink:amplitude=0.6,highpass=f=180,lowpass=f=3400," +
      "volume='if(lt(mod(t,4.0),3.2),0.35+0.65*abs(sin(2*PI*t*4)),0.0)':eval=frame",
    args: AUDIO,
  },
  {
    name: "clip.mp4",
    // 4 s of slowly drifting color gradients: enough motion for video scenes to prove they play.
    input: "gradients=s=640x360:r=30:d=4:speed=0.03",
    args: ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
  },
];

const only = process.argv.slice(2);
mkdirSync(STUDIO, { recursive: true });
mkdirSync(WWW, { recursive: true });

for (const output of outputs.filter((o) => only.length === 0 || only.includes(o.name))) {
  const file = path.resolve(STUDIO, output.name);
  const ffmpegArgs = ["-y", "-f", "lavfi", "-i", output.input, ...output.args, file];
  try {
    // cwd: apps/studio has remotion as a direct dependency, so npx resolves its bundled
    // ffmpeg from the local node_modules/.bin without a registry lookup for "remotion".
    execFileSync("npx", ["remotion", "ffmpeg", ...ffmpegArgs], { stdio: "inherit", cwd: path.resolve("apps/studio") });
  } catch (err) {
    // Remotion's bundled ffmpeg lacks some lavfi sources (anoisesrc) and may lack others; the system ffmpeg has them.
    console.warn(`remotion ffmpeg failed for ${output.name}, falling back to system ffmpeg: ${(err as Error).message}`);
    try {
      execFileSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    } catch (fallbackErr) {
      if ((fallbackErr as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `${output.name} needs ffmpeg on PATH (Remotion's bundled ffmpeg can't make it): brew install ffmpeg`,
        );
      }
      throw fallbackErr;
    }
  }
  cpSync(file, path.join(WWW, output.name));
  console.log(`ok   ${file} and ${path.join(WWW, output.name)}`);
}
