import { createSearchAPI } from "fumadocs-core/search/server";
import { componentUrl, itemMarkdown, items } from "@/lib/registry";
import { source } from "@/lib/source";

export const revalidate = false;

async function indexes() {
  const docs = await Promise.all(
    source.getPages().map(async (page) => ({
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      content: await page.data.getText("processed"),
    })),
  );
  const components = items.map((item) => ({
    title: item.title,
    description: item.description,
    url: componentUrl(item.name),
    content: itemMarkdown(item),
  }));
  return [...docs, ...components];
}

export const { staticGET: GET } = createSearchAPI("simple", { indexes });
