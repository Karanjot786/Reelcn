import { readFileSync } from "node:fs";
import path from "node:path";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageLastUpdate,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InstallBlock } from "@/components/install-block";
import { ItemPreview } from "@/components/item-preview";
import { JsonLd } from "@/components/json-ld";
import { demosFor, formatsFor, themeNames } from "@/lib/demos";
import { lastModified } from "@/lib/git-date";
import { linkifyBackticks } from "@/lib/item-markdown";
import { breadcrumbList } from "@/lib/json-ld";
import { REPO_URL } from "@/lib/layout.shared";
import { propsTable } from "@/lib/props-table";
import {
  categoryOf,
  componentUrl,
  getItem,
  installUrl,
  isLib,
  itemSourcePath,
  items,
  SITE_URL,
  sentenceCase,
} from "@/lib/registry";
import { themedUsage } from "@/lib/themed-usage";

// What people search for, by category ("remotion text animation", "remotion transition"); used in page titles.
const SEARCH_NOUN: Record<string, string> = {
  text: "text animation",
  motion: "animation",
  transitions: "transition",
  backgrounds: "animated background",
  overlays: "overlay",
  product: "product demo",
  data: "animated chart",
  audio: "audio",
  social: "social video",
  templates: "video template",
  tools: "tool",
  lib: "library",
};

function AvoidLine({ text }: { text: string }) {
  const segments = linkifyBackticks(text, (name) => (getItem(name) ? componentUrl(name) : undefined));
  return (
    <>
      {segments.map((segment, index) => {
        if (!segment.code) return <span key={index}>{segment.text}</span>;
        return segment.href ? (
          <Link key={index} href={segment.href}>
            <code>{segment.text}</code>
          </Link>
        ) : (
          <code key={index}>{segment.text}</code>
        );
      })}
    </>
  );
}

export default async function Page(props: PageProps<"/docs/components/[name]">) {
  const { name } = await props.params;
  const item = getItem(name);
  if (!item) notFound();

  const category = categoryOf(item);
  const parent = item.meta.preset ? getItem(item.meta.preset) : undefined;
  const demoIds = demosFor(item.name);
  const thumbs = Object.fromEntries(demoIds.map((id) => [id, formatsFor(id)]));
  const url = installUrl(item.name);
  const usage = item.docs?.replace(/^Usage:\n\n/, "") ?? "";
  const filePath = item.files[0].path;
  const lang = filePath.endsWith(".tsx") ? "tsx" : "ts";
  const sourcePath = itemSourcePath(item);
  const source = readFileSync(sourcePath, "utf-8");
  const rows = propsTable(sourcePath);
  const related = items.filter((other) => other.name !== item.name && categoryOf(other) === category).slice(0, 6);
  const dependencies = item.dependencies ?? [];
  const builtFromNames = (item.registryDependencies ?? []).map(
    (dep) =>
      dep
        .split("/")
        .pop()
        ?.replace(/\.json$/, "") ?? dep,
  );
  const hasPreview = !isLib(item) && demoIds.length > 0;
  // ponytail: story-built templates (the ones with scenes) are read off the demos source; importing the demo modules
  // here would pull Remotion into the page build.
  const demosSource = readFileSync(path.join(path.dirname(sourcePath), "..", "demos", "templates.tsx"), "utf-8");
  const hasScenes = hasPreview && (item.name === "storyboard" || demosSource.includes(`storyDemo("${item.name}"`));
  const composition = usage.match(/<Composition[\s\S]*?id="([^"]+)"/)?.[1];
  const markdownUrl = `${componentUrl(item.name)}.md`;

  const sections: [id: string, title: string, depth: number, shown: boolean][] = [
    ["preview", "Preview", 2, hasPreview],
    ["installation", "Installation", 2, true],
    ["usage", composition ? "Register the composition" : "Usage", 3, Boolean(usage)],
    ["render", "Render", 3, Boolean(composition)],
    ["props", "Props", 2, rows.length > 0],
    ["scenes", "Scenes", 2, hasScenes],
    ["built-from", "Built from", hasScenes ? 3 : 2, builtFromNames.length > 0],
    ["use", "Use", 2, item.meta.use.length > 0],
    ["avoid", "Avoid", 2, item.meta.avoid.length > 0],
    ["agent", "Make it with an agent", 2, category === "templates"],
    ["guides", "Guides", 2, !isLib(item)],
    ["source", "Source", 2, true],
    ["related", "Related", 2, related.length > 0],
  ];
  const toc = sections.filter(([, , , shown]) => shown).map(([id, title, depth]) => ({ title, url: `#${id}`, depth }));
  const pageUrl = `${SITE_URL}${componentUrl(item.name)}`;
  const modified = lastModified(sourcePath);
  const componentJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: sentenceCase(item.title),
    description: item.description,
    url: pageUrl,
    codeRepository: REPO_URL,
    programmingLanguage: "TypeScript",
    runtimePlatform: "Remotion",
    license: "https://opensource.org/licenses/MIT",
    dateModified: modified?.toISOString(),
    keywords: item.meta.tags.join(", ") || undefined,
    isPartOf: { "@id": `${SITE_URL}/#library` },
  };
  const breadcrumbJsonLd = breadcrumbList([
    ["reelcn", SITE_URL],
    ["Docs", `${SITE_URL}/docs`],
    ["Components", `${SITE_URL}/docs/components`],
    [sentenceCase(item.title), pageUrl],
  ]);

  const installation = (
    <section>
      <h2 id="installation">Installation</h2>
      <InstallBlock url={url} />
      <p>
        Files land in <code>src/reelcn/</code>
        {builtFromNames.length > 0 && " with the items it builds on"}.
        {dependencies.length > 0 && (
          <>
            {" "}
            Dependencies:{" "}
            {dependencies.map((dep, index) => (
              <span key={dep}>
                {index > 0 ? ", " : ""}
                <code>{dep}</code>
              </span>
            ))}
            .
          </>
        )}
      </p>
      {usage && (
        <>
          <h3 id="usage">{composition ? "Register the composition" : "Usage"}</h3>
          <ServerCodeBlock lang={lang} code={usage} />
        </>
      )}
      {composition && (
        <>
          <h3 id="render">Render</h3>
          <ServerCodeBlock
            lang="bash"
            code={`npx remotion render ${composition} # 16:9\nnpx remotion render ${composition} --width=1080 --height=1920 # 9:16`}
          />
        </>
      )}
    </section>
  );

  const propsSection = rows.length > 0 && (
    <section>
      <h2 id="props">Props</h2>
      <div className="ptable">
        <div className="prow">
          <span>Prop</span>
          <span>Type</span>
          <span>Description</span>
        </div>
        {rows.map((row) => (
          <div className="prow" key={row.name}>
            <span className="pn">
              {row.name}
              {row.required && <b>*</b>}
            </span>
            <span className="pt">{row.type}</span>
            <span className="pd">
              <AvoidLine text={row.description} />
              {row.default && (
                <>
                  {" "}
                  Default <code>{row.default}</code>.
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const builtFrom = builtFromNames.length > 0 && (
    <div className="deps">
      {builtFromNames.map((dep) => (
        <Link key={dep} href={componentUrl(dep)}>
          {dep}
        </Link>
      ))}
    </div>
  );

  return (
    <DocsPage toc={toc} tableOfContent={{ style: "clerk", single: true }} breadcrumb={{ enabled: false }}>
      <JsonLd data={componentJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="dhead">
        <div>
          <DocsTitle>{sentenceCase(item.title)}</DocsTitle>
          <DocsDescription>{item.description}</DocsDescription>
          {parent && (
            <p className="text-fd-muted-foreground text-sm">
              A preset of <Link href={componentUrl(parent.name)}>{sentenceCase(parent.title)}</Link>.
            </p>
          )}
        </div>
        <div className="copypage">
          <MarkdownCopyButton markdownUrl={markdownUrl}>Copy page</MarkdownCopyButton>
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={`${REPO_URL}/blob/main/${filePath}`} />
        </div>
      </div>
      <DocsBody className="flex flex-col gap-10">
        {hasPreview ? (
          <ItemPreview
            name={item.name}
            demoIds={demoIds}
            category={category}
            themes={themeNames}
            thumbs={thumbs}
            code={usage ? <ServerCodeBlock lang={lang} code={usage} /> : undefined}
            codeByTheme={
              usage
                ? Object.fromEntries(
                    themeNames.map((theme) => [
                      theme,
                      <ServerCodeBlock key={theme} lang={lang} code={themedUsage(usage, theme)} />,
                    ]),
                  )
                : undefined
            }
            builtFrom={builtFrom || undefined}
          >
            {installation}
            {propsSection}
          </ItemPreview>
        ) : (
          <>
            {installation}
            {propsSection}
            {builtFrom && (
              <section>
                <h2 id="built-from">Built from</h2>
                {builtFrom}
              </section>
            )}
          </>
        )}

        {(item.meta.use.length > 0 || item.meta.avoid.length > 0) && (
          <section className="grid gap-8 sm:grid-cols-2">
            {item.meta.use.length > 0 && (
              <div>
                <h2 id="use">Use</h2>
                <ul>
                  {item.meta.use.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.meta.avoid.length > 0 && (
              <div>
                <h2 id="avoid">Avoid</h2>
                <ul>
                  {item.meta.avoid.map((line) => (
                    <li key={line}>
                      <AvoidLine text={line} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {category === "templates" && (
          <section>
            <h2 id="agent">Make it with an agent</h2>
            <p>
              With the <Link href="/docs/agent-skill">reelcn agent skill</Link> installed, ask for the video in plain
              words, such as "make a launch video for Relay with reelcn". The skill picks a template, sets its props,
              reviews a contact sheet and renders.
            </p>
          </section>
        )}

        {!isLib(item) && (
          <section>
            <h2 id="guides">Guides</h2>
            <p>
              Components take their colors from a theme, their timing from motion props and their layout from the
              canvas.
            </p>
            <div className="chips">
              <Link className="chip" href="/docs/theming">
                Theming
              </Link>
              <Link className="chip" href="/docs/motion">
                Motion
              </Link>
              <Link className="chip" href="/docs/formats">
                Formats & safe zones
              </Link>
            </div>
          </section>
        )}

        <section>
          <h2 id="source">Source</h2>
          <details>
            <summary>{filePath}</summary>
            <ServerCodeBlock lang={lang} code={source} />
          </details>
        </section>

        {related.length > 0 && (
          <section>
            <h2 id="related">Related</h2>
            <div className="chips">
              {related.map((relatedItem) => (
                <Link key={relatedItem.name} className="chip" href={componentUrl(relatedItem.name)}>
                  {sentenceCase(relatedItem.title)}
                </Link>
              ))}
            </div>
          </section>
        )}
      </DocsBody>
      {modified && <PageLastUpdate date={modified} />}
    </DocsPage>
  );
}

export function generateStaticParams() {
  return items.map((item) => ({ name: item.name }));
}

export async function generateMetadata(props: PageProps<"/docs/components/[name]">): Promise<Metadata> {
  const { name } = await props.params;
  const item = getItem(name);
  if (!item) notFound();
  return {
    title: `${item.title} – Remotion ${SEARCH_NOUN[categoryOf(item)] ?? "component"}`,
    description: item.description,
    alternates: { canonical: componentUrl(item.name) },
  };
}
