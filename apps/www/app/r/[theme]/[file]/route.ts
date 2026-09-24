import { readFileSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { themeNames } from "@/lib/demos";
import { items, SITE_URL } from "@/lib/registry";
import { themedRegistryItem } from "@/lib/themed-registry";

// `/r/<theme>/<name>.json`: the registry item that installs with `<theme>` as the project's default theme.
// Prebuilt for every theme × item; daylight is the default, so it lives at the plain `/r/<name>.json`.
export const revalidate = false;
export const dynamicParams = false;

const THEMES = themeNames.filter((theme) => theme !== "daylight");

export async function GET(_req: Request, { params }: RouteContext<"/r/[theme]/[file]">) {
  const { theme, file } = await params;
  const name = file.replace(/\.json$/, "");
  if (!THEMES.includes(theme) || !items.some((item) => item.name === name)) notFound();
  const json = readFileSync(path.join(process.cwd(), "public", "r", `${name}.json`), "utf8");
  return new Response(themedRegistryItem(json, theme, SITE_URL), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return THEMES.flatMap((theme) => items.map((item) => ({ theme, file: `${item.name}.json` })));
}
