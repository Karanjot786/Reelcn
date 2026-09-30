// Every shipped sound and music bed must have a CC0 row in its folder's LICENSES.md.
// Run: node scripts/check-sfx-licenses.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";

const problems: string[] = [];
let checked = 0;

for (const dir of ["sfx", "music"]) {
  if (!existsSync(dir)) {
    console.log(`no ${dir} directory, nothing to check`);
    continue;
  }
  const manifest = readFileSync(`${dir}/LICENSES.md`, "utf8");
  const files = readdirSync(dir).filter((file) => file.endsWith(".mp3"));
  checked += files.length;
  for (const file of files) {
    const row = manifest.split("\n").find((line) => line.indexOf(`| ${file} |`) === 0);
    if (!row) problems.push(`${file}: no row in ${dir}/LICENSES.md`);
    else if (row.indexOf("CC0") === -1) problems.push(`${file}: licence is not CC0 (${row.trim()})`);
  }
  for (const [, named] of manifest.matchAll(/^\| ([\w-]+\.mp3) \|/gm)) {
    if (files.indexOf(named) === -1) problems.push(`${named}: listed in ${dir}/LICENSES.md but not in ${dir}/`);
  }
}

for (const problem of problems) console.error(problem);
console.log(`${checked} sound(s) checked, ${problems.length} problem(s)`);
process.exit(problems.length > 0 ? 1 : 0);
