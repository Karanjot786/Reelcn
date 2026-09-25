import { notFound } from "next/navigation";
import { propsTable } from "@/lib/props-table";
import { getItem, itemSourcePath, items } from "@/lib/registry";

// `/r/props/<name>.json`: each item's editable props, read from its TypeScript source at build time.
// `/r/custom` validates payloads against this, so it never needs the item source at request time.
export const revalidate = false;
export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<"/r/props/[file]">) {
  const item = getItem((await params).file.replace(/\.json$/, ""));
  if (!item) notFound();
  return Response.json(
    propsTable(itemSourcePath(item)).map(({ name, control, options }) => ({ name, control, options })),
  );
}

export function generateStaticParams() {
  return items.map((item) => ({ file: `${item.name}.json` }));
}
