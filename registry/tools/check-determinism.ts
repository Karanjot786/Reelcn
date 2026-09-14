/**
 * @title Check Determinism
 * @category tools
 * @description Scans your source for code that renders differently each time: wall-clock time, unseeded randomness, CSS animation and direct canvas-size reads.
 * @use Before a final render, or as a CI step
 * @tags determinism, lint, ci, agent
 * @example
 * node scripts/reelcn-check-determinism.ts
 * node scripts/reelcn-check-determinism.ts src remotion
 */
// ponytail: line-based regexes, no parser. Misses code split across lines; swap in the TypeScript AST if that bites.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Rule = { pattern: RegExp; message: string; onlyIn?: RegExp };

const RULES: Rule[] = [
  { pattern: /\bMath\.random\s*\(/, message: "Math.random differs on every render; use random(seed) from remotion" },
  { pattern: /\bDate\.now\s*\(/, message: "Date.now reads the wall clock; derive time from useCurrentFrame" },
  { pattern: /\bnew Date\(\s*\)/, message: "new Date without an argument reads the wall clock; pass a fixed date" },
  {
    pattern: /\b(animation|transition)\s*:\s*["'`][^"'`]*\d(ms|s)\b/,
    message: "CSS animation and transition run on the browser clock; animate with useMotion or interpolate",
  },
  {
    pattern: /className=\{?["'`][^"'`]*\b(animate|transition)-/,
    message: "Tailwind animate- and transition- classes run on the browser clock",
  },
  {
    pattern: /useVideoConfig\(\)\.(width|height)\b|\{[^}]*\b(width|height)\b[^}]*\}\s*=\s*useVideoConfig\(\)/,
    message: "read the canvas size through useViewport, so Viewport overrides work",
    // Only reelcn components must stay size-agnostic; your own compositions may read the real size.
    // registry/items is where reelcn keeps its own copies.
    onlyIn: /(^|\/)(reelcn|registry\/items)\//,
  },
  {
    pattern:
      /\.toLocaleString\(\s*\)|\.toLocaleString\(\s*undefined\s*[,)]|\bnew Intl\.\w+\(\s*\)|\bnew Intl\.\w+\(\s*undefined\b/,
    message:
      'toLocaleString/Intl without an explicit locale renders differently by machine locale; pass a literal locale (e.g. "en-US")',
  },
];

const SKIP = new Set(["node_modules", ".git", ".next", "out", "dist", "build"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : sourceFiles(full);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const roots = process.argv.slice(2);
let findings = 0;
for (const root of roots.length > 0 ? roots : ["src"]) {
  if (!existsSync(root)) {
    console.error(`no such directory: ${root}`);
    process.exit(2);
  }
  for (const file of sourceFiles(root)) {
    const shown = file.split(path.sep).join("/");
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        const code = line.trimStart();
        if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*")) return;
        for (const rule of RULES) {
          if (rule.onlyIn && !rule.onlyIn.test(shown)) continue;
          if (!rule.pattern.test(line)) continue;
          findings++;
          console.log(`${shown}:${index + 1}  ${rule.message}`);
        }
      });
  }
}

if (findings > 0) {
  console.error(`\n${findings} determinism problem(s)`);
  process.exit(1);
}
console.log("no determinism problems found");
