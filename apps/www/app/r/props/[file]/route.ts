import { notFound } from "next/navigation";
import { themeNames } from "@/lib/demos";
import { propsTable } from "@/lib/props-table";
import { getItem, itemSourcePath, items } from "@/lib/registry";

// `/r/props/<name>.json`: each item's editable props (from its TypeScript source) and the theme names, at build time.
// `/r/custom` validates payloads against this, so it never reads the item source or public/thumbs at request time.
export const revalidate = false;
export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<"/r/props/[file]">) {
  const item = getItem((await params).file.replace(/\.json$/, ""));
  if (!item) notFound();
  const rows = propsTable(itemSourcePath(item)).map(({ name, control, options }) => ({ name, control, options }));
  return Response.json({ rows, themes: themeNames });
}

export function generateStaticParams() {
  return items.map((item) => ({ file: `${item.name}.json` }));
}
