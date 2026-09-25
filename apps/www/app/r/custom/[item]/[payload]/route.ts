import { notFound } from "next/navigation";
import { customRegistryItem, decodePayload, validatePayload } from "@/lib/custom-install";
import { buildQuery, type EditableRow } from "@/lib/customize";
import { themeNames } from "@/lib/demos";
import { getItem, SITE_URL } from "@/lib/registry";

// `/r/custom/<item>/<payload>.json`: the item plus `<item>-custom.tsx` with the viewer's Customize settings baked in.
// The payload comes from the browser, so it is validated against the item's own props before any code is written.
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteContext<"/r/custom/[item]/[payload]">) {
  const { item: name, payload: raw } = await params;
  const item = getItem(name);
  if (!item) notFound();
  const decoded = decodePayload(raw.replace(/\.json$/, ""));
  const rows: EditableRow[] = await (await fetch(new URL(`/r/props/${name}.json`, req.url))).json();
  const payload = decoded && validatePayload(decoded, rows, themeNames);
  if (!payload) return new Response("Bad customize payload", { status: 400 });
  const theme = payload.theme === "daylight" ? undefined : payload.theme;
  // The share link is rebuilt here from validated props, never taken from the request.
  const edits = Object.fromEntries(
    rows.filter((row) => row.control && row.name in payload.props).map((row) => [row.name, payload.props[row.name]]),
  );
  const shareUrl = `${SITE_URL}/docs/components/${name}${buildQuery("", { theme, edits })}`;
  return new Response(
    customRegistryItem({
      item: name,
      component: payload.component,
      props: payload.props,
      theme,
      shareUrl,
      siteUrl: SITE_URL,
    }),
    {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}
