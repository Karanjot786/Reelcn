import path from "node:path";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageLastUpdate,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getMDXComponents } from "@/components/mdx";
import { lastModified } from "@/lib/git-date";
import { breadcrumbList } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/registry";
import { getPageMarkdownUrl } from "@/lib/shared";
import { source } from "@/lib/source";

// Search titles, in the words people type; the sidebar and the page heading keep the short front-matter title.
const SEARCH_TITLES: Record<string, string> = {
  "/docs": "Docs: copy-paste Remotion components",
  "/docs/installation": "Install Remotion components with the shadcn CLI",
  "/docs/theming": "Theming Remotion videos",
  "/docs/motion": "Remotion animation timing: enter and exit in frames",
  "/docs/formats": "Remotion formats: 16:9, 9:16 and 1:1 with safe zones",
  "/docs/captions": "Remotion captions: word-synced animated caption styles",
  "/docs/audio-and-sfx": "Remotion audio and sound effects",
  "/docs/templates": "Free Remotion video templates",
  "/docs/storyboard": "Remotion storyboard: write a video as JSON",
  "/docs/determinism": "Deterministic Remotion rendering",
  "/docs/agents": "reelcn for AI agents: shadcn MCP and llms.txt",
  "/docs/agent-skill": "Remotion agent skill: make videos with Claude Code",
  "/docs/recipes": "Remotion prompts: eight agent video recipes",
  "/docs/tutorials/tiktok-captions": "TikTok style captions in Remotion",
  "/docs/license": "Is Remotion free? reelcn and Remotion licenses",
  "/docs/remotion-vs-hyperframes": "Remotion vs HyperFrames: which to use",
};

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const url = `${SITE_URL}${page.url}`;
  const modified = lastModified(path.join("apps/www/content/docs", page.path));
  const trail: [string, string][] = [
    ["reelcn", SITE_URL],
    ["Docs", `${SITE_URL}/docs`],
  ];
  if (page.url !== "/docs") trail.push([page.data.title, url]);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.data.title,
    description: page.data.description,
    url,
    // From git history only; left out rather than guessed when the build has none.
    dateModified: modified?.toISOString(),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: "clerk", single: true }}>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbList(trail)} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={getPageMarkdownUrl(page).url} />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      {modified && <PageLastUpdate date={modified} />}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return {
    title: SEARCH_TITLES[page.url] ?? page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
  };
}
