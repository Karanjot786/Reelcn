import { readFileSync } from "node:fs";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCommand } from "@/components/copy-command";
import { FormatSwitch } from "@/components/format-switch";
import { demosFor, themeNames } from "@/lib/demos";
import { linkifyBackticks } from "@/lib/item-markdown";
import { propsTable } from "@/lib/props-table";
import {
  categories,
  categoryOf,
  componentUrl,
  getItem,
  installUrl,
  isLib,
  itemSourcePath,
  items,
} from "@/lib/registry";

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
  const demoIds = demosFor(item.name);
  const url = installUrl(item.name);
  const usage = item.docs?.replace(/^Usage:\n\n/, "") ?? "";
  const categoryTitle = categories.find((entry) => entry.id === category)?.title ?? category;
  const filePath = item.files[0].path;
  const lang = filePath.endsWith(".tsx") ? "tsx" : "ts";
  const sourcePath = itemSourcePath(item);
  const source = readFileSync(sourcePath, "utf-8");
  const rows = propsTable(sourcePath);
  const related = items.filter((other) => other.name !== item.name && categoryOf(other) === category).slice(0, 6);
  const dependencies = item.dependencies ?? [];
  const registryDependencies = item.registryDependencies ?? [];

  return (
    <DocsPage>
      <p className="font-semibold text-fd-muted-foreground text-sm">{categoryTitle}</p>
      <DocsTitle>{item.title}</DocsTitle>
      <DocsDescription>{item.description}</DocsDescription>
      <DocsBody className="flex flex-col gap-10">
        {!isLib(item) && demoIds.length > 0 && (
          <FormatSwitch demoIds={demoIds} category={category} themes={themeNames} />
        )}

        <section>
          <h2>Install</h2>
          <Tabs items={["npx", "pnpm", "bun", "@reelcn"]}>
            <Tab value="npx">
              <CopyCommand command={`npx shadcn add ${url}`} />
            </Tab>
            <Tab value="pnpm">
              <CopyCommand command={`pnpm dlx shadcn add ${url}`} />
            </Tab>
            <Tab value="bun">
              <CopyCommand command={`bunx --bun shadcn add ${url}`} />
            </Tab>
            <Tab value="@reelcn">
              <CopyCommand command={`npx shadcn add @reelcn/${item.name}`} />
            </Tab>
          </Tabs>
        </section>

        {usage && (
          <section>
            <h2>Usage</h2>
            <ServerCodeBlock lang={lang} code={usage} />
          </section>
        )}

        {rows.length > 0 && (
          <section>
            <h2>Props</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <code>
                        {row.name}
                        {row.required ? "" : "?"}
                      </code>
                    </td>
                    <td>
                      <code>{row.type}</code>
                    </td>
                    <td>{row.default ? <code>{row.default}</code> : "—"}</td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(item.meta.use.length > 0 || item.meta.avoid.length > 0) && (
          <section className="grid gap-8 sm:grid-cols-2">
            {item.meta.use.length > 0 && (
              <div>
                <h2>Use</h2>
                <ul>
                  {item.meta.use.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.meta.avoid.length > 0 && (
              <div>
                <h2>Avoid</h2>
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

        {(dependencies.length > 0 || registryDependencies.length > 0) && (
          <section>
            <h2>Dependencies</h2>
            {dependencies.length > 0 && (
              <p>
                {dependencies.map((dep, index) => (
                  <span key={dep}>
                    {index > 0 ? ", " : ""}
                    <code>{dep}</code>
                  </span>
                ))}
              </p>
            )}
            {registryDependencies.length > 0 && (
              <ul>
                {registryDependencies.map((dep) => {
                  const depName =
                    dep
                      .split("/")
                      .pop()
                      ?.replace(/\.json$/, "") ?? dep;
                  return (
                    <li key={dep}>
                      <Link href={componentUrl(depName)}>{depName}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <section>
          <h2>Source</h2>
          <details>
            <summary>{filePath}</summary>
            <ServerCodeBlock lang={lang} code={source} />
          </details>
        </section>

        {related.length > 0 && (
          <section>
            <h2>Related</h2>
            <div className="chips">
              {related.map((relatedItem) => (
                <Link key={relatedItem.name} className="chip" href={componentUrl(relatedItem.name)}>
                  {relatedItem.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </DocsBody>
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
  return { title: item.title, description: item.description };
}
