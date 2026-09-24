/**
 * The usage snippet as it reads with a non-default theme picked on the item page, so copied code matches the preview.
 * A `<Composition>` registration (templates) takes the theme through its default props; anything else is wrapped in
 * a `ThemeProvider`. `daylight` is the default theme, so it returns the snippet untouched.
 */
export function themedUsage(usage: string, theme: string): string {
  if (theme === "daylight") return usage;
  if (/<Composition\b/.test(usage)) {
    // `defaultProps={name}` or an inline `defaultProps={{ … }}`; the theme goes last so a spread can't override it.
    return usage
      .replace(/defaultProps=\{(\w+)\}/, `defaultProps={{ ...$1, theme: "${theme}" }}`)
      .replace(/defaultProps=\{\{ ([\s\S]*?) \}\}/, (match, props: string) =>
        props.endsWith(`theme: "${theme}"`) ? match : `defaultProps={{ ${props}, theme: "${theme}" }}`,
      );
  }
  const body = usage
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
  return `<ThemeProvider theme="${theme}">\n${body}\n</ThemeProvider>`;
}
