import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/registry";

// AI search crawlers get the same access as everyone; naming them makes the policy explicit.
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  // /api is the docs search index. /r and the markdown twins stay crawlable so their X-Robots-Tag: noindex is seen;
  // a Disallow would hide that header and leave the URLs indexable as bare links.
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: "/api/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
