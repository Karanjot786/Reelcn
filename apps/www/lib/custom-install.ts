import { type CustomProps, type EditableRow, fitValue } from "./customize.ts";

/** What a custom install URL carries: the full props, the picked theme and the component's export name. */
export type Payload = { props: CustomProps; theme?: string; component: string; unset?: string[] };

/** JSON, then base64url without padding, so it fits one URL path segment. Runs in the browser and on the server. */
export function encodePayload(payload: Payload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** A payload back, or null when it isn't base64url JSON of the right shape, or is over 8 KB. */
export function decodePayload(text: string): Payload | null {
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    if (binary.length > 8 * 1024) return null;
    const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
    const ok =
      typeof value?.props === "object" &&
      !Array.isArray(value.props) &&
      typeof value.component === "string" &&
      (value.theme === undefined || typeof value.theme === "string") &&
      (value.unset === undefined ||
        (Array.isArray(value.unset) && value.unset.every((n: unknown) => typeof n === "string")));
    return ok ? value : null;
  } catch {
    return null;
  }
}

// ponytail: copy of registry/items/core-math.ts's themeAliases, since core-math imports remotion and that breaks this
// server route. custom-install.test.ts pins the two equal.
export const themeAliases: Record<string, string> = { neon: "chromewave", paper: "ledger", sunset: "midnight" };

/**
 * Keeps only props the item declares. Controllable props must pass the share-link checks; the rest (chart data and
 * the like) pass as they are, since they came out of JSON.parse. Null when the theme or component name is bad.
 */
export function validatePayload(payload: Payload, rows: EditableRow[], themeNames: string[]): Payload | null {
  if (!/^[A-Za-z]\w*$/.test(payload.component)) return null;
  const theme = payload.theme === undefined ? undefined : (themeAliases[payload.theme] ?? payload.theme);
  if (theme !== undefined && !themeNames.includes(theme)) return null;
  const props: CustomProps = {};
  for (const row of rows) {
    if (!Object.hasOwn(payload.props, row.name)) continue;
    const value = row.control ? fitValue(row, payload.props[row.name]) : payload.props[row.name];
    if (value !== undefined) props[row.name] = value;
  }
  const unset = payload.unset?.filter((name) => name === "children" || rows.some((row) => row.name === name));
  return { props, component: payload.component, theme, unset };
}

/**
 * The installed `<item>-custom.tsx`: the item's component with these props as defaults, still overridable.
 * Server-generated from user input, so every value goes in as a JSON expression, never as raw JSX text.
 */
export function customFile(
  item: string,
  component: string,
  props: CustomProps,
  shareUrl: string,
  unset: string[] = [],
): string {
  // Props left for the user keep their own optionality, so a required one (captions) must still be passed.
  const required = unset.length
    ? ` & Pick<ComponentProps<typeof ${component}>, ${unset.map((name) => JSON.stringify(name)).join(" | ")}>`
    : "";
  const attrs = Object.entries(props).map(([name, value]) =>
    value === true ? name : `${name}={${JSON.stringify(value)}}`,
  );
  return `import type { ComponentProps } from "react";
import { ${component} } from "./${item}";

// Customized on reelcn.dev: ${shareUrl.replace(/[\r\n\u2028\u2029]/g, "")}
${unset.length ? `// Set these yourself: ${unset.join(", ")}\n` : ""}export function ${component}Custom(props: Partial<ComponentProps<typeof ${component}>>${required}) {
  return <${component} ${[...attrs, "{...props}"].join(" ")} />;
}
`;
}

/** The installed `<item>-custom.ts` for a transition: the factory with these options as defaults. */
export function customTransitionFile(item: string, factory: string, options: CustomProps, shareUrl: string): string {
  return `import { ${factory} } from "./${item}";

// Customized on reelcn.dev: ${shareUrl.replace(/[\r\n\u2028\u2029]/g, "")}
export const ${factory}Custom = (options: Parameters<typeof ${factory}>[0] = {}) =>
  ${factory}({ ...${JSON.stringify(options)}, ...options });
`;
}

/** The shadcn registry item for a custom install: the file above, depending on the (themed) item. */
export function customRegistryItem(p: {
  item: string;
  component: string;
  props: CustomProps;
  theme?: string;
  shareUrl: string;
  siteUrl: string;
  unset?: string[];
  transition?: boolean;
}): string {
  const ext = p.transition ? "ts" : "tsx";
  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: `${p.item}-custom`,
      type: "registry:item",
      registryDependencies: [p.theme ? `${p.siteUrl}/r/${p.theme}/${p.item}.json` : `${p.siteUrl}/r/${p.item}.json`],
      files: [
        {
          path: `registry/items/${p.item}-custom.${ext}`,
          type: "registry:file",
          target: `~/src/reelcn/${p.item}-custom.${ext}`,
          content: p.transition
            ? customTransitionFile(p.item, p.component, p.props, p.shareUrl)
            : customFile(p.item, p.component, p.props, p.shareUrl, p.unset),
        },
      ],
    },
    null,
    2,
  );
}
