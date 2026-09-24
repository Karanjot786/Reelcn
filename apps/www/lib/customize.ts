// Pure helpers for the item page's Customize panel: slider ranges, the JSX a customized demo reads as, and the
// scene file its Download button saves. No React, so node --test can cover them.

export type CustomProps = Record<string, unknown>;

/**
 * A slider's range from the prop's name and starting value. ponytail: name heuristics, no per-prop config;
 * add a per-demo override when one of these reads wrong.
 */
export function sliderRange(name: string, value: number): { min: number; max: number; step: number } {
  if (/weight$/i.test(name)) return { min: 100, max: 900, step: 100 };
  if (/^(delay|duration|stagger|holdFrames)$/.test(name)) return { min: 0, max: Math.max(90, value * 2), step: 1 };
  if (/(opacity|strength|amount|intensity)$/i.test(name) && value <= 1) return { min: 0, max: 1, step: 0.05 };
  if (/size$/i.test(name)) return { min: 12, max: Math.max(300, value * 2), step: 1 };
  return { min: 0, max: Math.max(100, Math.abs(value) * 3), step: value % 1 === 0 ? 1 : 0.1 };
}

function attr(name: string, value: unknown): string | null {
  if (value === undefined) return null;
  if (value === true) return name;
  if (typeof value === "string")
    return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
  return `${name}={${JSON.stringify(value)}}`;
}

/** `<Name a="x" b={2} />`, one line when short, one prop per line when long. */
export function toJsx(component: string, props: CustomProps): string {
  const attrs = Object.entries(props)
    .map(([name, value]) => attr(name, value))
    .filter((a): a is string => a !== null);
  const oneLine = `<${component}${attrs.map((a) => ` ${a}`).join("")} />`;
  if (oneLine.length <= 100) return oneLine;
  return `<${component}\n${attrs.map((a) => `  ${a}`).join("\n")}\n/>`;
}

const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

/** The downloadable `<Name>Scene.tsx`: imports from where `shadcn add` puts the files, the theme, the element. */
export function sceneFile(item: string, component: string, jsx: string, theme: string): string {
  let tree = `<Stage>\n  <Center>\n${indent(jsx, 4)}\n  </Center>\n</Stage>`;
  if (theme !== "daylight") tree = `<ThemeProvider theme="${theme}">\n${indent(tree, 2)}\n</ThemeProvider>`;
  const core = theme === "daylight" ? "Center, Stage" : "Center, Stage, ThemeProvider";
  return `import { ${core} } from "./reelcn/core";
import { ${component} } from "./reelcn/${item}";

export function ${component}Scene() {
  return (
${indent(tree, 4)}
  );
}
`;
}

export type EditableRow = { name: string; control?: string; options?: string[]; default?: string };

/** A prop's declared default (`"rise"`, `96`, `[]`) as a value; undefined when it is an expression. */
export function parseDefault(text?: string): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** What each control shows before any edit: the demo's own props, then each prop's declared default. */
export function startValues(rows: EditableRow[], base: CustomProps): CustomProps {
  const out: CustomProps = { ...base };
  for (const row of rows) {
    if (!(row.name in out)) {
      const value = parseDefault(row.default);
      if (value !== undefined) out[row.name] = value;
    }
  }
  return out;
}

/** Drops edits equal to their start (and undefined), so Reset, the URL and the code note agree on "no edits". */
export function pruneEdits(start: CustomProps, edits: CustomProps): CustomProps {
  return Object.fromEntries(
    Object.entries(edits).filter(
      ([name, value]) => value !== undefined && JSON.stringify(value) !== JSON.stringify(start[name]),
    ),
  );
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

/** The unit a number prop counts in, for the slider's readout and screen readers. */
export function unitFor(name: string): string | undefined {
  return /^(delay|duration|stagger|holdFrames)$/.test(name) ? "frames" : undefined;
}

const PARAM = "p.";
const MAX_TEXT = 200;
const MAX_ITEMS = 20;
// ponytail: a sane magnitude cap, so a hand-edited link can't ask a component for a 1e308-unit title.
const MAX_NUMBER = 100_000;

export function encodeEdits(edits: CustomProps): [string, string][] {
  return Object.entries(edits).map(([name, value]) => [
    `${PARAM}${name}`,
    Array.isArray(value) ? value.join(",") : String(value),
  ]);
}

/** Share-link params back into edits; anything that doesn't fit its prop's control is dropped. */
export function decodeEdits(rows: EditableRow[], params: URLSearchParams): CustomProps {
  const out: CustomProps = {};
  for (const row of rows) {
    const raw = params.get(`${PARAM}${row.name}`);
    if (raw === null) continue;
    switch (row.control) {
      case "switch":
        if (raw === "true" || raw === "false") out[row.name] = raw === "true";
        break;
      case "slider": {
        const number = Number(raw);
        if (raw.trim() !== "" && Number.isFinite(number) && Math.abs(number) <= MAX_NUMBER) out[row.name] = number;
        break;
      }
      case "select":
        if (row.options?.includes(raw)) out[row.name] = raw;
        break;
      case "color":
        if (isHexColor(raw)) out[row.name] = raw;
        break;
      case "text":
        out[row.name] = raw.slice(0, MAX_TEXT);
        break;
      case "list":
        out[row.name] = raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, MAX_ITEMS);
        break;
    }
  }
  return out;
}

/** The page's query string with our params (`demo`, `theme`, `p.*`) replaced; other params stay. "" when empty. */
export function buildQuery(search: string, state: { demo?: string; theme?: string; edits: CustomProps }): string {
  const params = new URLSearchParams(search);
  for (const key of [...params.keys()]) {
    if (key === "demo" || key === "theme" || key.startsWith(PARAM)) params.delete(key);
  }
  if (state.demo) params.set("demo", state.demo);
  if (state.theme) params.set("theme", state.theme);
  for (const [key, value] of encodeEdits(state.edits)) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}
