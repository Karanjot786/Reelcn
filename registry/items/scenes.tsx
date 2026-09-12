/**
 * @title Scenes
 * @category transitions
 * @description Plays a list of scenes back to back with a transition between each pair, and computes the total length for calculateMetadata.
 * @duration data-driven
 * @use Assembling a whole video from scene components, one entry per scene
 * @use Mixing reelcn transitions with the ones built into @remotion/transitions
 * @tags scenes, sequence, timeline, storyboard
 * @example
 * <Scenes
 *   items={[
 *     { node: <Intro />, duration: 90, transition: splitDoors() },
 *     { node: <Features />, duration: 150, transition: fade(), timing: linearTiming({ durationInFrames: 15 }) },
 *     { node: <Outro />, duration: 90 },
 *   ]}
 *   defaultTiming={linearTiming({ durationInFrames: 24 })}
 * />
 */
import {
  linearTiming,
  type TransitionPresentation,
  TransitionSeries,
  type TransitionTiming,
} from "@remotion/transitions";
import type React from "react";
import { Fragment } from "react";

// biome-ignore lint/suspicious/noExplicitAny: every presentation, reelcn or built-in, has its own props type.
type AnyPresentation = TransitionPresentation<any>;

export type SceneItem = {
  node: React.ReactNode;
  /** Length in frames, including the frames shared with its transitions. */
  duration: number;
  /** Transition into the next scene. Ignored on the last scene. */
  transition?: AnyPresentation;
  /** Timing of that transition. */
  timing?: TransitionTiming;
};

export type ScenesProps = {
  items: SceneItem[];
  /** Used after scenes that set no transition. Without one, those scenes hard-cut. */
  defaultTransition?: AnyPresentation;
  /** Used by transitions that set no timing. Defaults to 20 linear frames. */
  defaultTiming?: TransitionTiming;
  style?: React.CSSProperties;
  className?: string;
};

type Defaults = Pick<ScenesProps, "defaultTransition" | "defaultTiming">;

const FALLBACK_TIMING = linearTiming({ durationInFrames: 20 });

/** The transition after scene `index`, or null for a hard cut. */
function transitionAfter(items: SceneItem[], index: number, defaults: Defaults) {
  const presentation = items[index].transition ?? defaults.defaultTransition;
  if (index >= items.length - 1 || !presentation) return null;
  return { presentation, timing: items[index].timing ?? defaults.defaultTiming ?? FALLBACK_TIMING };
}

export function Scenes({ items, defaultTransition, defaultTiming, style, className }: ScenesProps) {
  const defaults = { defaultTransition, defaultTiming };
  return (
    <TransitionSeries style={style} className={className}>
      {items.map((item, index) => {
        const next = transitionAfter(items, index, defaults);
        return (
          <Fragment key={index}>
            <TransitionSeries.Sequence durationInFrames={item.duration}>{item.node}</TransitionSeries.Sequence>
            {next ? <TransitionSeries.Transition presentation={next.presentation} timing={next.timing} /> : null}
          </Fragment>
        );
      })}
    </TransitionSeries>
  );
}

/**
 * Total frames of `<Scenes>`: every scene's duration minus the frames each transition overlaps.
 * Pass the same defaults you give `<Scenes>`, e.g. from `calculateMetadata`.
 */
export function getScenesDuration(items: SceneItem[], fps: number, defaults: Defaults = {}): number {
  return items.reduce((total, item, index) => {
    const next = transitionAfter(items, index, defaults);
    return total + item.duration - (next ? next.timing.getDurationInFrames({ fps }) : 0);
  }, 0);
}
