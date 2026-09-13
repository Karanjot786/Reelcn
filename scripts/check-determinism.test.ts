import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const TOOL = path.resolve("registry/tools/check-determinism.ts");
const run = (...dirs: string[]) => spawnSync("node", [TOOL, ...dirs], { encoding: "utf8" });

function project(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), "determinism-fixture-"));
  for (const [file, source] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), source);
  }
  return root;
}

test("flags clock, randomness, CSS animation and canvas reads, with file and line", () => {
  const root = project({
    "src/reelcn/bad.tsx": [
      "const a = Math.random();",
      "const b = Date.now();",
      "const c = new Date();",
      'const d = { transition: "opacity 300ms" };',
      'const e = <div className="animate-spin" />;',
      "const { width } = useVideoConfig();",
    ].join("\n"),
    "src/good.tsx": [
      "// Math.random() is banned here",
      'const seeded = random("seed");',
      'const fixed = new Date("2026-01-01");',
      'const scene = { transition: "slice-slide", sfx: "transition-hit" };',
      "const { width } = useVideoConfig();",
    ].join("\n"),
  });
  const result = run(path.join(root, "src"));
  assert.equal(result.status, 1);
  const found = result.stdout
    .trim()
    .split("\n")
    .map((line) => line.slice(line.indexOf("src/")).split("  ")[0]);
  assert.deepEqual(found, [
    "src/reelcn/bad.tsx:1",
    "src/reelcn/bad.tsx:2",
    "src/reelcn/bad.tsx:3",
    "src/reelcn/bad.tsx:4",
    "src/reelcn/bad.tsx:5",
    "src/reelcn/bad.tsx:6",
  ]);
});

test("exits 0 on a clean project and 2 on a missing directory", () => {
  const root = project({ "src/ok.tsx": 'export const x = random("a");' });
  assert.equal(run(path.join(root, "src")).status, 0);
  assert.equal(run(path.join(root, "nope")).status, 2);
});
