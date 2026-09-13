// Every shipped sound must have a CC0 row in sfx/LICENSES.md.
// Run: node scripts/check-sfx-licenses.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";

if (!existsSync("sfx")) {
  console.log("no sfx directory, nothing to check");
  process.exit(0);
}

const manifest = readFileSync("sfx/LICENSES.md", "utf8");
const sounds = readdirSync("sfx").filter((file) => file.endsWith(".mp3"));
const problems: string[] = [];

for (const sound of sounds) {
  const row = manifest.split("\n").find((line) => line.indexOf(`| ${sound} |`) === 0);
  if (!row) problems.push(`${sound}: no row in sfx/LICENSES.md`);
  else if (row.indexOf("CC0") === -1) problems.push(`${sound}: licence is not CC0 (${row.trim()})`);
}
for (const [, named] of manifest.matchAll(/^\| ([\w-]+\.mp3) \|/gm)) {
  if (sounds.indexOf(named) === -1) problems.push(`${named}: listed in LICENSES.md but not in sfx/`);
}

for (const problem of problems) console.error(problem);
console.log(`${sounds.length} sound(s) checked, ${problems.length} problem(s)`);
process.exit(problems.length > 0 ? 1 : 0);
