import type * as PageTree from "fumadocs-core/page-tree";
import { categories, componentUrl } from "./registry";
import { source } from "./source";

const guides = source.getPageTree();

/** Guides (from `content/docs`) plus a generated "Components" section: one folder per category, items as pages. */
export const docsTree: PageTree.Root = {
  ...guides,
  children: [
    ...guides.children,
    { type: "separator", name: "Components" },
    { type: "page", name: "All components", url: "/docs/components" },
    ...categories.map(
      (category): PageTree.Folder => ({
        type: "folder",
        name: category.title,
        children: category.items.map(
          (item): PageTree.Item => ({
            type: "page",
            name: item.title,
            url: componentUrl(item.name),
          }),
        ),
      }),
    ),
  ],
};
