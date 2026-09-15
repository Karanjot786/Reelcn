// Scene boundaries for story-built demos, so site players can mark and name each scene on their scrubber.
import { type CustomSceneRule, type Story, storyTimeline } from "../items/story.ts";

export type SceneMark = { name: string; from: number; background?: string };

/**
 * Where each scene starts, in frames: a scene begins as the previous scene's fade starts. A story with a template's
 * own scene types needs that template's rules (`custom`), the same list its `<Storyboard scenes>` gets.
 */
export function sceneMarks(story: Story, custom: CustomSceneRule[] = []): SceneMark[] {
  const { frames, overlaps } = storyTimeline(story, custom);
  let from = 0;
  return story.scenes.map((scene, index) => {
    const mark: SceneMark = { name: scene.type, from };
    if (typeof scene.background === "string") mark.background = scene.background;
    from += frames[index] - (overlaps[index] ?? 0);
    return mark;
  });
}

/** Index of the scene playing at `frame`: the last one that has started. */
export function sceneIndexAt(marks: SceneMark[], frame: number): number {
  return Math.max(
    0,
    marks.findLastIndex((mark) => frame >= mark.from),
  );
}
