/**
 * @title SFX Pull
 * @category tools
 * @description Downloads the reelcn sound pack into your public folder so renders work offline.
 * @use Rendering on a machine with no network, or in CI
 * @use Pinning the sounds so a later reelcn release cannot change them
 * @example
 * node scripts/reelcn-sfx-pull.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = "https://reelcn.dev/sfx";
const OUT = path.join("public", "reelcn", "sfx");
const ITEM = path.join("src", "reelcn", "sfx.tsx");

const names = readFileSync(ITEM, "utf8")
  .split("\n")
  .map((line) => line.match(/^\s*"([a-z0-9-]+)",$/))
  .filter((match): match is RegExpMatchArray => match !== null)
  .map((match) => match[1]);

if (names.length === 0) throw new Error(`no sound names found in ${ITEM} — is the sfx item installed?`);

mkdirSync(OUT, { recursive: true });
for (const name of names) {
  const response = await fetch(`${BASE}/${name}.mp3`);
  if (!response.ok) throw new Error(`${name}.mp3: ${response.status} ${response.statusText}`);
  writeFileSync(path.join(OUT, `${name}.mp3`), Buffer.from(await response.arrayBuffer()));
  console.log(`ok   ${path.join(OUT, `${name}.mp3`)}`);
}

const source = readFileSync(ITEM, "utf8");
writeFileSync(ITEM, source.replace("export const SFX_LOCAL = false;", "export const SFX_LOCAL = true;"));
console.log(`${names.length} sounds in ${OUT}; SFX_LOCAL is now true, so renders read them from disk.`);
