import type * as PageTree from "fumadocs-core/page-tree";
import { Fragment } from "react";
import { demoFrames, firstDemo } from "./demos";
import { categories, componentUrl, sentenceCase } from "./registry";
import { source } from "./source";

const guides = source.getPageTree();

// `key`: Fumadocs renders a node's icon and name side by side in one list.
const glyph = (children: React.ReactNode) => (
  <svg key="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    {children}
  </svg>
);
const icon = (d: string) =>
  glyph(<path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />);

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

// Guide page glyphs; the first six are the mockup's, the rest reuse its category glyphs or its stroke style.
const GUIDE_ICONS: Record<string, React.ReactNode> = {
  "/docs": icon("M2 7l6-5 6 5v7H2z"),
  "/docs/installation": icon("M3 8h10M8 3v10"),
  "/docs/theming": glyph(
    <>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
    </>,
  ),
  "/docs/formats": glyph(
    <>
      <rect x="2" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11" y="3" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </>,
  ),
  "/docs/captions": icon("M3 5h10M3 8h7M3 11h9"),
  "/docs/storyboard": glyph(<rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />),
  "/docs/motion": CATEGORY_ICONS.motion,
  "/docs/audio-and-sfx": CATEGORY_ICONS.audio,
  "/docs/templates": CATEGORY_ICONS.templates,
  "/docs/agents": icon("M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2"),
  "/docs/determinism": icon("M3 5h10M3 8h10M3 11h10"),
  "/docs/license": icon("M4 2h6l3 3v9H4zM10 2v3h3"),
};

// Template glyphs: the first six are the mockup's; the rest follow its 16px, 1.3 stroke style.
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  storyboard: glyph(<rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />),
  "product-launch": icon("M3 12l3-8 3 5 2-3 2 6"),
  "feature-short": glyph(<rect x="5" y="2" width="6" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />),
  changelog: icon("M3 4h10M3 8h10M3 12h6"),
  audiogram: icon("M5.5 5v6M8 3v10M10.5 6v4M3 7.5v1M13 7.5v1"),
  tutorial: icon("M5 5L2 8l3 3M11 5l3 3-3 3"),
  "app-promo": icon("M5 2h6v12H5zM7 12h2"),
  "data-story": icon("M3 13V8M8 13V4M13 13V6"),
  "listicle-short": icon("M3 4h2M7 4h6M3 8h2M7 8h6M3 12h2M7 12h6"),
  "podcast-teaser": icon("M6 3h4v6H6zM4 8a4 4 0 0 0 8 0M8 12v2"),
  "post-to-video": icon("M3 3h10v7H7l-3 3v-3H3z"),
  "talking-head-short": icon("M6 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 13c0-2 2-3 4-3s4 1 4 3"),
  "testimonial-reel": icon("M3 4h10v6H8l-3 3v-3H3zM6 7h4"),
  "youtube-intro": icon("M2 4h12v8H2zM7 6l3 2-3 2z"),
  "youtube-outro": icon("M2 4h12v8H2zM5 7h6M5 9h4"),
};

/** The sidebar's length tag: seconds at 30 fps for a template, "json" for the storyboard engine. */
function lengthTag(name: string): string | undefined {
  if (name === "storyboard") return "json";
  const frames = demoFrames[firstDemo(name) ?? name];
  return frames ? `${Math.floor(frames / 30)}s` : undefined;
}

// `key`s: Fumadocs renders a node's icon and name side by side in one list.
const label = (title: string, tag: string | number | undefined) => (
  <Fragment key="name">
    {title}
    {tag !== undefined && <span className="nd-count">{tag}</span>}
  </Fragment>
);

const templates = categories.find((category) => category.id === "templates")?.items ?? [];

/** Guides (from `content/docs`) plus a generated "Components" section: one folder per category, items as pages. */
export const docsTree: PageTree.Root = {
  ...guides,
  children: [
    { type: "separator", name: "Get started" },
    ...guides.children.map((node) =>
      node.type === "page" && GUIDE_ICONS[node.url] ? { ...node, icon: GUIDE_ICONS[node.url] } : node,
    ),
    { type: "separator", name: "Templates" },
    ...[...templates]
      .sort((a, b) => Number(b.name === "storyboard") - Number(a.name === "storyboard"))
      .map(
        (item): PageTree.Item => ({
          type: "page",
          icon: TEMPLATE_ICONS[item.name],
          name: label(sentenceCase(item.title), lengthTag(item.name)),
          url: componentUrl(item.name),
        }),
      ),
    { type: "separator", name: "Components" },
    { type: "page", name: "All components", url: "/docs/components" },
    ...categories
      .filter((category) => category.id !== "templates")
      .map(
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
              name: sentenceCase(item.title),
              url: componentUrl(item.name),
            }),
          ),
        }),
      ),
  ],
};
