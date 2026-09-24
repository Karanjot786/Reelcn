import { type ComponentType, createElement, type ReactElement, type ReactNode } from "react";
import type { Demo } from "./index";

/**
 * Opts a demo into the site's Customize panel. One source for the plain demo and the editable one, so they can't
 * drift: `component` renders `props`, and `customize.render` renders `props` with the viewer's edits merged on top.
 * `name` is the component's export name as a string (minified bundles lose `Function.name`); a test checks it.
 */
export function customizable<P extends object>(
  name: string,
  Component: ComponentType<P>,
  props: P,
  wrap: (element: ReactElement) => ReactNode = (element) => element,
): Pick<Demo, "component" | "customize"> {
  const render = (edited: Record<string, unknown>) => wrap(createElement(Component, edited as P));
  return {
    component: () => render(props as Record<string, unknown>),
    customize: { name, props: props as Record<string, unknown>, render },
  };
}
