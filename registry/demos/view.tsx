import { Stage, type ThemeName, ThemeProvider } from "../items/core";
import type { Demo } from "./index";

/** One demo, rendered the way Studio and the docs site both show it: themed, on a Stage unless the demo is bare. */
export function DemoFrame({ demo, theme }: { demo: Demo; theme: ThemeName }) {
  const { component: Component, bare } = demo;
  return (
    <ThemeProvider theme={theme}>
      {bare ? (
        <Component />
      ) : (
        <Stage>
          <Component />
        </Stage>
      )}
    </ThemeProvider>
  );
}
