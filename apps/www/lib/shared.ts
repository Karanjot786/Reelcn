import { createGetUrl } from "fumadocs-core/source";

export const docsRoute = "/docs";
export const docsContentRoute = "/llms.mdx/docs";

const getContentUrl = createGetUrl(docsContentRoute);

/** Where the raw markdown of a docs page lives (agents fetch it; `/docs/<page>.md` rewrites here). */
export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "content.md"];
  return { segments, url: getContentUrl(segments, page.locale) };
}
