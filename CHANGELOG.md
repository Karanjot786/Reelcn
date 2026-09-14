## Phase 2: new default theme, `daylight`

`ThemeProvider`'s default theme changes from `midnight` to `daylight`. This is an intended visual
change, not a bug: every demo, thumbnail and doc example that doesn't pass `theme=` explicitly now
renders with a light flat background, Schibsted Grotesk headings, a cobalt accent, 14-unit corner
radius and `settle` motion, instead of the old near-black/Inter/indigo/20-radius/`smooth` look. (The
"Studio" direction's gradient/soft-light feel comes from `aurora`/`gradient-mesh`/`beams`/`spotlight`
when a template uses one as a background, not from the base canvas itself.)

`theme="midnight"` still exists and still restores the same layout, safe zones and props as before, but
**not** the old colors or type: `midnight`'s own tokens moved to a "Blueprint" direction (navy background,
chalk-white accent, IBM Plex family) as part of the same rewrite. There is no built-in preset that
reproduces the pre-Phase-2 default pixel-for-pixel. If you need that exact look, pin it yourself:

```tsx
import { createTheme } from "@/registry/items/core";

const legacyMidnight = createTheme("midnight", {
  colors: {
    background: "#0b0d12",
    surface: "#151922",
    foreground: "#f5f7fb",
    muted: "#8b93a7",
    border: "#262c3a",
    accent: "#6d7cff",
    accentForeground: "#ffffff",
    highlight: "#ffd84d",
  },
  fonts: { heading: "Inter, ui-sans-serif, system-ui, sans-serif", body: "Inter, ui-sans-serif, system-ui, sans-serif" },
  headingWeight: 700,
  radius: 20,
  motion: "smooth",
});
```
