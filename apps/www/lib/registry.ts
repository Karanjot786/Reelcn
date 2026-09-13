// Typed, server-safe access to the repo-root registry.json. Never imports @reelcn/registry/demos or an item file.
import path from "node:path";
import { fileURLToPath } from "node:url";
import registryJson from "../../../registry.json" with { type: "json" };

export type Item = {
  name: string;
  title: string;
  description: string;
  categories: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; target: string }[];
  docs?: string;
  meta: { duration?: string; use: string[]; avoid: string[]; tags: string[] };
};

export type Category = { id: string; title: string; items: Item[] };

type RawFile = { path: string; type: string; target: string };
type RawItem = {
  name: string;
  title: string;
  description: string;
  categories: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  files: RawFile[];
  docs?: string;
  meta: { duration?: string; use: string[]; avoid: string[]; tags: string[] };
};
type RawRegistry = { name: string; homepage: string; items: RawItem[] };

const raw = registryJson as RawRegistry;

/** `registry.homepage`: where installed items' `registryDependencies` and `installUrl` point. */
export const SITE_URL: string = raw.homepage;

export const items: Item[] = raw.items.map((item) => ({
  name: item.name,
  title: item.title,
  description: item.description,
  categories: item.categories,
  dependencies: item.dependencies,
  registryDependencies: item.registryDependencies,
  files: item.files.map((file) => ({ path: file.path, target: file.target })),
  docs: item.docs,
  meta: item.meta,
}));

export const categoryOrder = [
  "text",
  "motion",
  "transitions",
  "backgrounds",
  "overlays",
  "product",
  "data",
  "audio",
  "social",
  "tools",
  "lib",
] as const;

const CATEGORY_TITLES: Record<(typeof categoryOrder)[number], string> = {
  text: "Text",
  motion: "Motion",
  transitions: "Transitions",
  backgrounds: "Backgrounds",
  overlays: "Overlays",
  product: "Product",
  data: "Data",
  audio: "Audio",
  social: "Social",
  tools: "Tools",
  lib: "Libraries",
};

export function categoryOf(item: Item): string {
  return item.categories[0];
}

export function isLib(item: Item): boolean {
  return categoryOf(item) === "lib";
}

export const categories: Category[] = categoryOrder.map((id) => ({
  id,
  title: CATEGORY_TITLES[id],
  items: items.filter((item) => categoryOf(item) === id),
}));

const byName = new Map(items.map((item) => [item.name, item]));

export function getItem(name: string): Item | undefined {
  return byName.get(name);
}

export function installUrl(name: string): string {
  return `${SITE_URL}/r/${name}.json`;
}

export function componentUrl(name: string): string {
  return `/docs/components/${name}`;
}

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Absolute path of the item's source file (registry.json paths are repo-root relative). */
export function itemSourcePath(item: Item): string {
  return path.join(repoRoot, item.files[0].path);
}

/** Search-index and raw-markdown content for one item: title, description, install command, usage, use/avoid, deps. Task 6 appends the props table when rendering the full item page. */
export function itemMarkdown(item: Item): string {
  const lines = [
    `# ${item.title}`,
    "",
    item.description,
    "",
    "```bash",
    `npx shadcn add ${installUrl(item.name)}`,
    "```",
  ];
  // `docs` is "Usage:\n\n<code>" (build-registry's @example); fence the code so markdown readers don't parse the JSX.
  const usage = item.docs?.replace(/^Usage:\n\n/, "");
  if (usage) lines.push("", "Usage:", "", "```tsx", usage, "```");
  if (item.meta.use.length > 0) lines.push("", "Use for:", "", ...item.meta.use.map((line) => `- ${line}`));
  if (item.meta.avoid.length > 0) lines.push("", "Avoid:", "", ...item.meta.avoid.map((line) => `- ${line}`));
  if (item.dependencies && item.dependencies.length > 0) {
    lines.push("", "Dependencies:", "", ...item.dependencies.map((dep) => `- \`${dep}\``));
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
