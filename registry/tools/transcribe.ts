/**
 * @title Transcribe
 * @category tools
 * @description Turns audio or video into word-level captions JSON for the caption components.
 * @env OPENAI_API_KEY
 * @use Captioning a talking-head short, a podcast clip or a tutorial
 * @use Converting an existing .srt into the caption format
 * @example
 * node scripts/reelcn-transcribe.ts talk.mp4
 * node scripts/reelcn-transcribe.ts talk.mp4 --openai --out public/captions/talk.json
 * node scripts/reelcn-transcribe.ts subtitles.srt
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseSrt } from "@remotion/captions";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type WhisperModel,
} from "@remotion/install-whisper-cpp";
import { openAiWhisperApiToCaptions } from "@remotion/openai-whisper";

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith("--"));
const flag = (name: string) => args.find((arg) => arg.indexOf(`--${name}=`) === 0)?.slice(name.length + 3);

if (!input) {
  console.error(
    "usage: node scripts/reelcn-transcribe.ts <audio|video|srt> [--model=small.en] [--openai] [--out=path.json]",
  );
  process.exit(1);
}

const out = flag("out") ?? path.join("public", "captions", `${path.basename(input).replace(/\.[^.]+$/, "")}.json`);
const model = (flag("model") ?? "small.en") as WhisperModel;
const whisperCppVersion = "1.5.5";
const whisperDir = path.join(".reelcn", "whisper");
mkdirSync(path.dirname(out), { recursive: true });

const write = (captions: unknown) => {
  writeFileSync(out, `${JSON.stringify(captions, null, 2)}\n`);
  console.log(`${out}: ${(captions as unknown[]).length} captions`);
};

if (input.endsWith(".srt")) {
  // .srt has no word timings, so each subtitle line becomes one caption.
  const { captions } = parseSrt({ input: readFileSync(input, "utf8") });
  write(captions);
} else if (args.indexOf("--openai") !== -1) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("--openai needs OPENAI_API_KEY in the environment");
  const body = new FormData();
  body.append("file", new Blob([readFileSync(input)]), path.basename(input));
  body.append("model", "whisper-1");
  body.append("response_format", "verbose_json");
  body.append("timestamp_granularities[]", "word");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!response.ok) throw new Error(`OpenAI: ${response.status} ${await response.text()}`);
  const { captions } = openAiWhisperApiToCaptions({ transcription: await response.json() });
  write(captions);
} else {
  // whisper.cpp wants 16kHz mono wav; Remotion ships the ffmpeg that makes one.
  const wav = path.resolve(".reelcn", `${path.basename(input).replace(/\.[^.]+$/, "")}-16k.wav`);
  mkdirSync(path.dirname(wav), { recursive: true });
  execFileSync("npx", ["remotion", "ffmpeg", "-y", "-i", input, "-ar", "16000", "-ac", "1", wav], { stdio: "inherit" });

  await installWhisperCpp({ to: whisperDir, version: whisperCppVersion });
  await downloadWhisperModel({ model, folder: whisperDir });
  const whisperCppOutput = await transcribe({
    inputPath: wav,
    whisperPath: whisperDir,
    whisperCppVersion,
    modelFolder: whisperDir,
    model,
    tokenLevelTimestamps: true,
  });
  const { captions } = toCaptions({ whisperCppOutput });
  write(captions);
}
