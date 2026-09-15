import { notFound } from "next/navigation";
import { propsMarkdownTable } from "@/lib/item-markdown";
import { propsTable } from "@/lib/props-table";
import { getItem, itemMarkdown, itemSourcePath, items } from "@/lib/registry";
import { getPageMarkdownUrl } from "@/lib/shared";
import { docsLlms, source } from "@/lib/source";

export const revalidate = false;

// Markdown twins are for agents; search engines should index the HTML page (/docs/x.md rewrites here too).
const MARKDOWN_HEADERS = { "Content-Type": "text/markdown; charset=utf-8", "X-Robots-Tag": "noindex" };

function componentMarkdownSegments(name: string) {
  return ["components", name, "content.md"];
}

export async function GET(_req: Request, { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">) {
  const { slug = [] } = await params;

  if (slug[0] === "components" && slug.length === 3 && slug[2] === "content.md") {
    const item = getItem(slug[1]);
    if (!item) notFound();
    const rows = propsTable(itemSourcePath(item));
    const body = [itemMarkdown(item), rows.length > 0 ? `## Props\n\n${propsMarkdownTable(rows)}` : ""]
      .filter(Boolean)
      .join("\n\n");
    return new Response(body, { headers: MARKDOWN_HEADERS });
  }

  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return new Response(await docsLlms.page(page), { headers: MARKDOWN_HEADERS });
}

export function generateStaticParams() {
  const guidePages = source.getPages().map((page) => ({ slug: getPageMarkdownUrl(page).segments }));
  const componentPages = items.map((item) => ({ slug: componentMarkdownSegments(item.name) }));
  return [...guidePages, ...componentPages];
}
