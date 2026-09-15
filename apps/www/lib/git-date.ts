import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function git(args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

// A shallow clone (Vercel's default) dates every older file to its cut-off commit, and no date beats a wrong one.
// On Vercel, set VERCEL_DEEP_CLONE=true to get full history and real dates.
const fullHistory = git(["rev-parse", "--is-shallow-repository"]) === "false";

/** When a file last changed, from git. Undefined without full git history. Paths are absolute or repo-root relative. */
export function lastModified(file: string): Date | undefined {
  if (!fullHistory) return undefined;
  const iso = git(["log", "-1", "--format=%cI", "--", file]);
  return iso ? new Date(iso) : undefined;
}
