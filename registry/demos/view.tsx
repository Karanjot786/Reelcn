import { Stage, type ThemeName, ThemeProvider } from "../items/core";
import type { Demo } from "./index";

/** One demo, rendered the way Studio and the docs site both show it: themed, on a Stage unless the demo is bare. */
export function DemoFrame({
  demo,
  theme,
  overrides,
}: {
  demo: Demo;
  theme: ThemeName;
  /** Prop edits from the site's Customize panel; only applied when the demo opts in with `customize`. */
  overrides?: Record<string, unknown>;
}) {
  const { component: Component, customize, bare } = demo;
  // An element, not a component made here: a fresh component per render would remount the scene every frame.
  const content = customize && overrides ? customize.render({ ...customize.props, ...overrides }) : <Component />;
  return <ThemeProvider theme={theme}>{bare ? content : <Stage>{content}</Stage>}</ThemeProvider>;
}
