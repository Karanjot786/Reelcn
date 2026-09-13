export type TextSegment = { text: string; href?: string; code?: boolean };

/**
 * Splits `text` on backticked names (`` `name` ``), resolving each one through `resolveHref`. A name
 * that resolves keeps its backtick styling and becomes a link; one that doesn't (returns `undefined`)
 * stays styled as code with no link. Used for the item page's "Avoid" list, whose `@avoid` targets
 * (e.g. "Headlines — use `text-reveal`") name other registry items by their kebab-case id.
 */
export function linkifyBackticks(text: string, resolveHref: (name: string) => string | undefined): TextSegment[] {
  const pattern = /`([a-z0-9-]+)`/g;
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const [full, name] = match;
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ text: text.slice(lastIndex, index) });
    segments.push({ text: name, href: resolveHref(name), code: true });
    lastIndex = index + full.length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });
  return segments;
}

export type PropRowLike = { name: string; type: string; required: boolean; default?: string; description: string };

/**
 * Renders props rows (see `lib/props-table.ts`'s `PropRow`) as a markdown table, or "" for an empty
 * list — used by the item page's raw-markdown route to append a Props section to `itemMarkdown(item)`.
 * A union's `|` is escaped as `\|`: GFM splits table cells on a bare `|` even inside a code span.
 */
export function propsMarkdownTable(rows: PropRowLike[]): string {
  if (rows.length === 0) return "";
  const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const header = "| Name | Type | Default | Description |\n| --- | --- | --- | --- |";
  const body = rows
    .map((row) => {
      const name = row.required ? row.name : `${row.name}?`;
      const def = row.default ? `\`${cell(row.default)}\`` : "—";
      return `| ${name} | \`${cell(row.type)}\` | ${def} | ${cell(row.description)} |`;
    })
    .join("\n");
  return `${header}\n${body}`;
}
