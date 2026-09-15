import { execFileSync } from "node:child_process";
import path from "node:path";
import type { MetadataRoute } from "next";
import { componentUrl, itemSourcePath, items, SITE_URL } from "@/lib/registry";
import { source } from "@/lib/source";

// `next build` runs in apps/www; git runs from the monorepo root.
const repoRoot = path.join(process.cwd(), "..", "..");

/**
 * When the file behind a page last changed, from git. Undefined without git history (Vercel builds ship no .git):
 * a build-time date would mark every URL as changed on every deploy.
 */
function lastModified(file: string): Date | undefined {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}

// Every indexable HTML page, from the same lists that generate the pages: registry items and the docs source.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: lastModified("apps/www/app/page.tsx") },
    ...source.getPages().map((page) => ({
      url: `${SITE_URL}${page.url}`,
      lastModified: lastModified(path.join("apps/www/content/docs", page.path)),
    })),
    { url: `${SITE_URL}/docs/components`, lastModified: lastModified("registry.json") },
    ...items.map((item) => ({
      url: `${SITE_URL}${componentUrl(item.name)}`,
      lastModified: lastModified(itemSourcePath(item)),
    })),
  ];
}
