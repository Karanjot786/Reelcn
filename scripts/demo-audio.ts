// Generates the two demo tracks the audio items preview against, with the ffmpeg bundled in Remotion.
// Run: node scripts/demo-audio.ts   (writes both apps' public/reelcn-demo/*.mp3; commit the result)
// voice.mp3 needs a system ffmpeg on PATH: Remotion's bundled ffmpeg build lacks the anoisesrc filter.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const STUDIO = "apps/studio/public/reelcn-demo";
const WWW = "apps/www/public/reelcn-demo";

// ponytail: lavfi generators instead of licensed audio. Swap in real music only if a demo needs musicality.
const tracks = [
  {
    name: "beat.mp3",
    // 120bpm: a 60Hz kick every 0.5s plus a quiet 220Hz bed, so waveform and spectrum both have something to show.
    filter:
      "sine=frequency=60:duration=6,volume='if(lt(mod(t,0.5),0.12),1.0,0.05)':eval=frame[kick];" +
      "sine=frequency=220:duration=6,volume=0.12[bed];" +
      "[kick][bed]amix=inputs=2:duration=first",
  },
  {
    name: "voice.mp3",
    // Speech-shaped: band-limited noise gated into ~4 syllables a second, with gaps between phrases.
    filter:
      "anoisesrc=duration=6:color=pink:amplitude=0.6,highpass=f=180,lowpass=f=3400," +
      "volume='if(lt(mod(t,4.0),3.2),0.35+0.65*abs(sin(2*PI*t*4)),0.0)':eval=frame",
  },
];

mkdirSync(STUDIO, { recursive: true });
mkdirSync(WWW, { recursive: true });

for (const track of tracks) {
  const output = path.resolve(STUDIO, track.name);
  const ffmpegArgs = ["-y", "-f", "lavfi", "-i", track.filter, "-ac", "1", "-ar", "44100", "-b:a", "96k", output];
  try {
    // cwd: apps/studio has remotion as a direct dependency, so npx resolves its bundled
    // ffmpeg from the local node_modules/.bin without a registry lookup for "remotion".
    execFileSync("npx", ["remotion", "ffmpeg", ...ffmpegArgs], { stdio: "inherit", cwd: path.resolve("apps/studio") });
  } catch (err) {
    // Remotion's bundled ffmpeg is built without lavfi noise sources (no anoisesrc), so
    // voice.mp3's filter fails there. Fall back to the system ffmpeg with identical args.
    console.warn(`remotion ffmpeg failed for ${track.name}, falling back to system ffmpeg: ${(err as Error).message}`);
    try {
      execFileSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    } catch (fallbackErr) {
      if ((fallbackErr as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          "voice.mp3 needs ffmpeg on PATH (Remotion's bundled ffmpeg lacks anoisesrc) — install it, e.g. brew install ffmpeg",
        );
      }
      throw fallbackErr;
    }
  }
  cpSync(output, path.join(WWW, track.name));
  console.log(`ok   ${output} and ${path.join(WWW, track.name)}`);
}
