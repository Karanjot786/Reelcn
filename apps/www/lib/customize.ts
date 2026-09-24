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
