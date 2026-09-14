// Derives registry.json, the shadcn artifacts and the llms files from each registry file's JSDoc header and imports.
// Run: node scripts/build-registry.ts
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

/** npm packages registry code may import (spec §4.2). Anything else needs a spec change. */
export const ALLOWED_PACKAGES = new Set([
  "remotion",
  "@remotion/google-fonts",
  "@remotion/transitions",
  "@remotion/media-utils",
  "@remotion/captions",
  "@remotion/media",
  "mediabunny",
  "@remotion/install-whisper-cpp",
  "@remotion/openai-whisper",
  "@remotion/bundler",
  "@remotion/renderer",
  "zod",
]);

export type Header = {
  title: string;
  category: string;
  description: string;
  duration?: string;
  use: string[];
  avoid: string[];
  tags: string[];
  env: string[];
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
  const use = many("use");
  if (use.length === 0 && !DURATIONLESS.has(category)) {
    throw new Error(`${file}: missing @use (say what the item is for; agents pick components from it)`);
  }

  return {
    title: one("title") as string,
    category,
    description: one("description") as string,
    duration,
    use,
    avoid: many("avoid"),
    tags: (one("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    env: many("env"),
    preset: one("preset"),
    example: one("example") as string,
  };
}

export function parseImports(source: string, file: string): { local: string[]; npm: string[] } {
  // An import must end its line, and must not sit inside a template string (code-block and terminal demos show code).
  // Inside a template string, the count of backticks before the line is odd. The header is dropped first so its
  // backticks (in @avoid) don't count.
  // ponytail: O(n²) backtick counting; fine for single-file items, swap for a tokenizer if a file passes ~100 KB.
  const body = source.replace(/^\/\*\*[\s\S]*?\*\//, "");
  const specifiers = [...body.matchAll(/^(?:import|export)\s(?:[^;]*?\sfrom\s)?["']([^"']+)["'][ \t]*;?[ \t]*$/gm)]
    .filter((match) => (body.slice(0, match.index).match(/`/g) ?? []).length % 2 === 0)
    .map((match) => match[1]);
  // Tools (registry/tools/) run in Node, not the browser, so they may reach for Node built-ins;
  // items keep the strict browser-only allowlist. Either way, `node:*` is never an npm dependency.
  const isTool = file.startsWith("registry/tools/");
  const local: string[] = [];
  const npm: string[] = [];
  for (const specifier of specifiers) {
    if (specifier.startsWith("@/")) {
      throw new Error(`${file}: "${specifier}" is a path alias; registry code imports siblings as "./name"`);
    }
    if (specifier.startsWith(".")) {
      const name = specifier.replace(/^\.\//, "").replace(/\.tsx?$/, "");
      if (!specifier.startsWith("./") || name.includes("/")) {
        throw new Error(`${file}: "${specifier}" must be a flat sibling import like "./core"`);
      }
      if (!local.includes(name)) local.push(name);
      continue;
    }
    if (specifier.startsWith("node:")) {
      if (isTool) continue;
      throw new Error(`${file}: "${specifier}" is not on the dependency allowlist (spec §4.2)`);
    }
    const root = specifier
      .split("/")
      .slice(0, specifier.startsWith("@") ? 2 : 1)
      .join("/");
    if (root === "react" || root === "react-dom") continue;
    if (!ALLOWED_PACKAGES.has(root)) {
      throw new Error(`${file}: "${root}" is not on the dependency allowlist (spec §4.2)`);
    }
    if (!npm.includes(root)) npm.push(root);
  }
  return { local, npm };
}

/** Theme preset names, read from core.tsx as text: importing core needs a browser, because fonts load at import. */
export function themeNamesFromSource(source = readFileSync("registry/items/core.tsx", "utf8")): string[] {
  const names = [...source.matchAll(/^\s{4}name: "(\w+)",$/gm)].map((match) => match[1]);
  if (names.length === 0) throw new Error("no themes found in registry/items/core.tsx");
  return names;
}

type Item = ReturnType<typeof collect>[number];

function collect(base: string) {
  const sources = [
    { dir: "registry/items", target: (file: string) => `~/src/reelcn/${file}` },
    { dir: "registry/tools", target: (file: string) => `~/scripts/reelcn-${file}` },
  ];
  return sources.flatMap(({ dir, target }) =>
    (existsSync(dir) ? readdirSync(dir).sort() : [])
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .map((file) => {
        const filePath = path.posix.join(dir, file);
        const source = readFileSync(filePath, "utf8");
        const { title, description, category, example, env, ...meta } = parseHeader(source, filePath);
        const imports = parseImports(source, filePath);
        return {
          name: file.replace(/\.tsx?$/, ""),
          type: "registry:item" as const,
          title,
          description,
          categories: [category],
          dependencies: imports.npm,
          registryDependencies: imports.local.map((dependency) => `${base}/r/${dependency}.json`),
          ...(env.length > 0
            ? { envVars: env.reduce<Record<string, string>>((all, name) => ({ ...all, [name]: "" }), {}) }
            : {}),
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

/** Replaces the lines between `<!-- name:start -->` and `<!-- name:end -->`, so generated sections sit inside hand-written files. */
export function replaceBlock(text: string, name: string, body: string): string {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`missing ${start} … ${end} markers`);
  return `${text.slice(0, from + start.length)}\n${body.trim()}\n${text.slice(to)}`;
}

function readmeInstall(base: string, repo: string) {
  return [
    "## Install",
    "",
    "Start a Remotion project, then add any item. Files land in `src/reelcn/`; no config and no path aliases.",
    "",
    "```bash",
    "npx create-video@latest",
    `npx shadcn@latest add ${base}/r/text-reveal.json`,
    "```",
    "",
    `Browse every item with live previews at ${base}/docs/components.`,
    "",
    `Agents: \`npx skills add ${repo}\` installs the reelcn skill, and ${base}/llms.txt lists the whole catalog.`,
  ].join("\n");
}

function readmeCatalog(items: Item[]) {
  const rows = CATEGORIES.map((category) => {
    const names = items.filter((item) => item.categories[0] === category).map((item) => `\`${item.name}\``);
    return `| ${category} | ${names.length} | ${names.slice(0, 5).join(", ")}${names.length > 5 ? ", …" : ""} |`;
  });
  return [`${items.length} items.`, "", "| Category | Items | Examples |", "|---|---|---|", ...rows].join("\n");
}

function main() {
  const base = (process.env.REELCN_URL ?? "https://www.reelcn.dev").replace(/\/$/, "");
  const items = collect(base);
  validate(items);

  const themes = themeNamesFromSource();

  writeFileSync(
    "registry.json",
    `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "reelcn", homepage: base, items }, null, 2)}\n`,
  );
  // Clear stale artifacts so a deleted or renamed item cannot linger in public/r.
  rmSync("apps/www/public/r", { recursive: true, force: true });
  execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", "apps/www/public/r"], {
    stdio: "inherit",
  });

  // Sound effects are binary, so they ship as hosted files rather than through the registry.
  if (existsSync("sfx")) {
    cpSync("sfx", "apps/www/public/sfx", { recursive: true });
  }

  writeFileSync("apps/www/public/llms.txt", llms(items, base, themes, false));
  writeFileSync("apps/www/public/llms-full.txt", llms(items, base, themes, true));

  // The agent skill ships a catalog snapshot; agents with network access read the live llms.txt instead.
  mkdirSync("skills/reelcn", { recursive: true });
  writeFileSync(
    "skills/reelcn/catalog.md",
    `<!-- Generated by scripts/build-registry.ts. Live version: ${base}/llms.txt -->\n\n${llms(items, base, themes, false)}`,
  );

  const repo = process.env.REELCN_REPO ?? "Karanjot786/reelcn";
  if (existsSync("README.md")) {
    const readme = readFileSync("README.md", "utf8");
    writeFileSync(
      "README.md",
      replaceBlock(replaceBlock(readme, "install", readmeInstall(base, repo)), "catalog", readmeCatalog(items)),
    );
  }
  console.log(`built ${items.length} items for ${base}`);
}

// Importing this file (the unit tests do) must not run the build. import.meta.main, unlike comparing
// process.argv[1] to the module URL, is still true when the script is run through a symlinked path.
if (import.meta.main) main();
