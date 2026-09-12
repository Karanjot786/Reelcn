// Derives registry.json, the shadcn artifacts and the llms files from each registry file's JSDoc header and imports.
// Run: node scripts/build-registry.ts
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const CATEGORIES = [
  "lib",
  "text",
  "motion",
  "transitions",
  "backgrounds",
  "overlays",
  "product",
  "social",
  "data",
  "audio",
  "templates",
  "tools",
] as const;

export type Header = {
  title: string;
  category: string;
  description: string;
  duration?: string;
  use: string[];
  avoid: string[];
  tags: string[];
  preset?: string;
  example: string;
};

/** Categories whose items are static code, so they carry no natural duration. */
const DURATIONLESS = new Set(["lib", "tools"]);

export function parseHeader(source: string, file: string): Header {
  const block = source.match(/^\/\*\*([\s\S]*?)\*\//)?.[1];
  if (!block) throw new Error(`${file}: missing /** @title … */ header`);

  const tags: { name: string; value: string }[] = [];
  for (const line of block.split("\n").map((raw) => raw.replace(/^\s*\* ?/, ""))) {
    const match = line.match(/^@(\w+)\s*(.*)$/);
    if (match) tags.push({ name: match[1], value: match[2] });
    else if (tags.length > 0) tags[tags.length - 1].value += `\n${line}`;
  }
  const one = (name: string) => tags.find((tag) => tag.name === name)?.value.trim();
  const many = (name: string) => tags.filter((tag) => tag.name === name).map((tag) => tag.value.trim());

  for (const required of ["title", "category", "description", "example"]) {
    if (!one(required)) throw new Error(`${file}: missing @${required}`);
  }
  const category = one("category") as string;
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error(`${file}: unknown @category "${category}" (expected one of ${CATEGORIES.join(", ")})`);
  }
  const duration = one("duration");
  if (duration && !/^(\d+|sustained|data-driven)$/.test(duration)) {
    throw new Error(`${file}: invalid @duration "${duration}" (frames at 30fps, "sustained" or "data-driven")`);
  }
  if (!duration && !DURATIONLESS.has(category)) throw new Error(`${file}: missing @duration`);

  return {
    title: one("title") as string,
    category,
    description: one("description") as string,
    duration,
    use: many("use"),
    avoid: many("avoid"),
    tags: (one("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    preset: one("preset"),
    example: one("example") as string,
  };
}

export function parseImports(source: string, file: string): { local: string[]; npm: string[] } {
  const specifiers = [...source.matchAll(/^(?:import|export)\s(?:[^;]*?\sfrom\s)?["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
  const local: string[] = [];
  const npm: string[] = [];
  for (const specifier of specifiers) {
    if (specifier.startsWith(".")) {
      const name = specifier.replace(/^\.\//, "").replace(/\.tsx?$/, "");
      if (!specifier.startsWith("./") || name.includes("/")) {
        throw new Error(`${file}: "${specifier}" must be a flat sibling import like "./core"`);
      }
      if (!local.includes(name)) local.push(name);
      continue;
    }
    const root = specifier
      .split("/")
      .slice(0, specifier.startsWith("@") ? 2 : 1)
      .join("/");
    if (root === "react" || root === "react-dom") continue;
    if (!npm.includes(root)) npm.push(root);
  }
  return { local, npm };
}

type Item = ReturnType<typeof collect>[number];

function collect(base: string) {
  const sources = [
    { dir: "registry/items", target: (file: string) => `~/src/reelcn/${file}` },
    { dir: "registry/tools", target: (file: string) => `~/scripts/reelcn-${file}` },
  ];
  return sources.flatMap(({ dir, target }) =>
    (existsSync(dir) ? readdirSync(dir).sort() : [])
      .filter((file) => /\.tsx?$/.test(file))
      .map((file) => {
        const filePath = path.posix.join(dir, file);
        const source = readFileSync(filePath, "utf8");
        const { title, description, category, example, ...meta } = parseHeader(source, filePath);
        const imports = parseImports(source, filePath);
        return {
          name: file.replace(/\.tsx?$/, ""),
          type: "registry:item" as const,
          title,
          description,
          categories: [category],
          dependencies: imports.npm,
          registryDependencies: imports.local.map((dependency) => `${base}/r/${dependency}.json`),
          files: [{ path: filePath, type: "registry:file" as const, target: target(file) }],
          docs: `Usage:\n\n${example}`,
          meta,
        };
      }),
  );
}

function validate(items: Item[]) {
  const names = new Set<string>();
  for (const item of items) {
    if (names.has(item.name)) throw new Error(`duplicate item name "${item.name}" — installed files are flat`);
    names.add(item.name);
  }
  for (const item of items) {
    for (const url of item.registryDependencies) {
      const dependency = url.split("/r/")[1].replace(".json", "");
      if (!names.has(dependency)) throw new Error(`${item.name}: imports "./${dependency}", which is not an item`);
    }
    for (const avoid of item.meta.avoid) {
      for (const [, referenced] of avoid.matchAll(/`([a-z0-9-]+)`/g)) {
        if (!names.has(referenced))
          throw new Error(`${item.name}: @avoid names \`${referenced}\`, which is not an item`);
      }
    }
  }
}

function llms(items: Item[], base: string, themes: string[], full: boolean) {
  const lines = [
    "# reelcn",
    "",
    "> Copy-paste Remotion components that adapt to any aspect ratio and restyle from a single theme.",
    "",
    `Install any item: \`npx shadcn@latest add ${base}/r/<name>.json\`. Files land in \`src/reelcn/\`; no components.json and no path aliases are needed.`,
    "",
    "How they work:",
    `- Wrap scenes in \`<ThemeProvider theme="midnight">\` (themes: ${themes.join(", ")}); \`createTheme\` makes a brand kit.`,
    "- Sizes are design units: `u(n)` is n px when the canvas short side is 1080px, so one component fits 16:9, 9:16 and 1:1.",
    "- Motion props are frames: `delay`, `duration`, `exit`, `motion` (smooth, snappy, bouncy, gentle, linear).",
    "- Components exit automatically at the end of their `<Sequence>`; pass `exit={false}` to hold.",
    "",
  ];
  for (const category of CATEGORIES) {
    const group = items.filter((item) => item.categories[0] === category);
    if (group.length === 0) continue;
    lines.push(`## ${category}`, "");
    for (const item of group) {
      const facts = [
        item.meta.duration ? `length ${item.meta.duration}${/^\d+$/.test(item.meta.duration) ? "f@30fps" : ""}` : "",
        item.meta.use.length > 0 ? `use for ${item.meta.use.join("; ")}` : "",
        item.meta.avoid.length > 0 ? `avoid ${item.meta.avoid.join("; ")}` : "",
      ].filter(Boolean);
      lines.push(
        `- [${item.title}](${base}/r/${item.name}.json): ${item.description}${facts.length ? ` (${facts.join(" · ")})` : ""}`,
      );
      if (full) lines.push("", "```tsx", item.docs.replace("Usage:\n\n", ""), "```", "");
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function main() {
  const base = (process.env.REELCN_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const items = collect(base);
  validate(items);

  const themes = [...readFileSync("registry/items/core.tsx", "utf8").matchAll(/^\s{4}name: "(\w+)",$/gm)].map(
    (match) => match[1],
  );
  if (themes.length === 0) throw new Error("no themes found in registry/items/core.tsx");

  writeFileSync(
    "registry.json",
    `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "reelcn", homepage: base, items }, null, 2)}\n`,
  );
  execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", "apps/www/public/r"], {
    stdio: "inherit",
  });

  writeFileSync("apps/www/public/llms.txt", llms(items, base, themes, false));
  writeFileSync("apps/www/public/llms-full.txt", llms(items, base, themes, true));
  console.log(`built ${items.length} items for ${base}`);
}

// Importing this file (the unit tests do) must not run the build. import.meta.main, unlike comparing
// process.argv[1] to the module URL, is still true when the script is run through a symlinked path.
if (import.meta.main) main();
