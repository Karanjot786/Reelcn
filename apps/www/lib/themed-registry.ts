// A registry item as served under `/r/<theme>/<name>.json`: the same files, but installing it makes `<theme>` the
// project's default theme, so a component picked in mono on the site renders in mono with no ThemeProvider.
// Only `core` changes (its two daylight defaults); every other item just points its reelcn dependencies at the
// same theme folder, so the `core` it pulls in is the themed one.

type RegistryFile = { path: string; content?: string; [key: string]: unknown };
type RegistryItem = { name: string; files?: RegistryFile[]; registryDependencies?: string[]; [key: string]: unknown };

// The two places core.tsx sets its default; both must change, or ThemeProvider and useTheme would disagree.
const CORE_DEFAULTS = ["createContext<Theme>(themes.daylight)", 'theme = "daylight",'] as const;

export function themedRegistryItem(json: string, theme: string, siteUrl: string): string {
  const item = JSON.parse(json) as RegistryItem;
  const base = `${siteUrl}/r/`;
  item.registryDependencies = item.registryDependencies?.map((dep) =>
    dep.startsWith(base) ? `${base}${theme}/${dep.slice(base.length)}` : dep,
  );
  if (item.name === "core") {
    for (const file of item.files ?? []) {
      if (!file.content?.includes(CORE_DEFAULTS[0])) continue;
      for (const needle of CORE_DEFAULTS) {
        // Fail the build rather than silently ship a "themed" core that still defaults to daylight.
        if (!file.content.includes(needle)) throw new Error(`core.tsx no longer contains ${needle}`);
      }
      file.content = file.content
        .replace(CORE_DEFAULTS[0], `createContext<Theme>(themes.${theme})`)
        .replace(CORE_DEFAULTS[1], `theme = "${theme}",`);
    }
  }
  return `${JSON.stringify(item, null, 2)}\n`;
}
