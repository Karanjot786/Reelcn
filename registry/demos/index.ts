import type React from "react";
import motion from "./motion";
import social from "./social";
import text from "./text";

/** A preview of one item, shown in Studio and (later) on the docs site. */
export type Demo = {
  /** Unique kebab-case id, prefixed with the registry item name. */
  id: string;
  /** Frames at 30fps. */
  duration: number;
  component: React.ComponentType;
  /** Set when the component paints its own full-bleed background, so `<Stage>` is skipped. */
  bare?: boolean;
};

// Each category adds one entry. Tasks 3-5 and later plans extend this map.
const groups: Record<string, Demo[]> = { motion, social, text };

export const demos = Object.entries(groups).flatMap(([category, list]) => list.map((demo) => ({ ...demo, category })));
