import type * as PageTree from "fumadocs-core/page-tree";
import { categories, componentUrl } from "./registry";
import { source } from "./source";

const guides = source.getPageTree();

const icon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// One glyph per category, from the mockup's sidebar.
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  text: icon("M3 4h10M8 4v9"),
  motion: icon("M2 12C5 12 5 4 8 4s3 8 6 8"),
  transitions: icon("M2 3h6v10H2zM10 3h4M10 13h4M14 3v10"),
  backgrounds: icon("M2.5 6a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M8 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0"),
  overlays: icon("M2 9h9v4H2zM2 3h12v4H2"),
  product: icon("M2 3h12v8H2zM6 14h4"),
  data: icon("M3 13V8M8 13V4M13 13V6"),
  social: icon("M3 3h10v7H7l-3 3v-3H3z"),
  audio: icon("M3 7.5v1M5.5 5v6M8 3v10M10.5 6v4M13 7.5v1"),
  templates: icon("M3 12l3-8 3 5 2-3 2 6"),
  lib: icon("M3 3h4v10H3zM9 3h4v10H9"),
  tools: icon("M10 3a3 3 0 0 0-3 4L3 11l2 2 4-4a3 3 0 0 0 4-3l-2 1-1-1z"),
};

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
        icon: CATEGORY_ICONS[category.id],
        name: (
          <>
            {category.title}
            <span className="nd-count">{category.items.length}</span>
          </>
        ),
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
