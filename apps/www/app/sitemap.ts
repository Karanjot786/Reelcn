import path from "node:path";
import type { MetadataRoute } from "next";
import { lastModified } from "@/lib/git-date";
import { componentUrl, itemSourcePath, items, SITE_URL } from "@/lib/registry";
import { source } from "@/lib/source";

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
