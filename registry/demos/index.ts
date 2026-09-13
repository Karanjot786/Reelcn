import type React from "react";
import audio from "./audio";
import backgrounds from "./backgrounds";
import data from "./data";
import motion from "./motion";
import overlays from "./overlays";
import product from "./product";
import type { SceneMark } from "./scene-marks";
import social from "./social";
import templates from "./templates";
import text from "./text";
import transitions from "./transitions";

/** A preview of one item, shown in Studio and (later) on the docs site. */
export type Demo = {
  /** Unique kebab-case id, prefixed with the registry item name. */
  id: string;
  /** Frames at 30fps. */
  duration: number;
  component: React.ComponentType;
  /** Set when the component paints its own full-bleed background, so `<Stage>` is skipped. */
  bare?: boolean;
  /** Frame the thumbnail script stills instead of the midpoint, for demos whose midpoint is a blank/solid frame. */
  thumbFrame?: number;
  /** Scene starts for story-built demos; the site marks them on its scrubber. */
  scenes?: SceneMark[];
};

// Each category adds one entry. Tasks 3-5 and later plans extend this map.
const groups: Record<string, Demo[]> = {
  audio,
  backgrounds,
  data,
  motion,
  overlays,
  product,
  social,
  templates,
  text,
  transitions,
};

export const demos = Object.entries(groups).flatMap(([category, list]) => list.map((demo) => ({ ...demo, category })));
