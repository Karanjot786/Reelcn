/**
 * @title Listicle Short
 * @category templates
 * @description Vertical numbered list: a title, then one scene per item with its number, point and optional image.
 * @duration data-driven
 * @use "Three ways to…" and top-five shorts
 * @use Splitting a blog post into a quick video
 * @avoid Mixed scene types — use `storyboard`
 * @tags listicle, list, short, top, template
 * @example
 * <Composition
 *   id="ListicleShort"
 *   component={ListicleShort}
 *   schema={listicleShortSchema}
 *   defaultProps={listicleShortDefaults}
 *   calculateMetadata={listicleShortMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const listicleShortSchema = templateSchema.extend({
  title: z.string(),
  items: z.array(z.object({ title: z.string(), body: z.string().optional(), image: z.string().optional() })).min(1),
});

export type ListicleShortProps = z.infer<typeof listicleShortSchema>;

export const listicleShortDefaults: ListicleShortProps = {
  title: "Three habits of teams that ship weekly",
  items: [
    { title: "Small pull requests", body: "Nothing over three hundred lines." },
    { title: "A fixed release day", body: "Thursday, every week." },
    { title: "One owner per launch", body: "Someone whose name is on it." },
  ],
};

export function listicleShortStory(props: ListicleShortProps): Story {
  const { title, items } = props;
  return templateStory(
    props,
    [
      { type: "title", title, background: "aurora" },
      ...items.map(
        (item, index): Scene =>
          item.image
            ? { type: "image", src: item.image, caption: `${index + 1}. ${item.title}` }
            : { type: "title", kicker: `${index + 1} of ${items.length}`, title: item.title, subtitle: item.body },
      ),
    ],
    "slice-slide",
  );
}

export function ListicleShort(props: ListicleShortProps) {
  return <Storyboard story={listicleShortStory(props)} />;
}

export const listicleShortMetadata = templateMetadata(listicleShortStory);
