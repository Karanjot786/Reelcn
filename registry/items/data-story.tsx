/**
 * @title Data Story
 * @category templates
 * @description Report video that walks through numbers: a title, then one bar, line, donut or stat scene per section with its caption.
 * @duration data-driven
 * @use Quarterly results, year-in-review and research findings
 * @use Turning a dashboard into a narrated walkthrough
 * @avoid A single number — use `stat-counter`
 * @tags data, charts, report, stats, template
 * @example
 * <Composition
 *   id="DataStory"
 *   component={DataStory}
 *   schema={dataStorySchema}
 *   defaultProps={dataStoryDefaults}
 *   calculateMetadata={dataStoryMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const dataStorySchema = templateSchema.extend({
  title: z.string(),
  sections: z
    .array(
      z.object({
        kind: z.enum(["bar", "line", "donut", "stat"]),
        /** For `stat`, the first entry is the number and its label. */
        data: z.array(z.object({ label: z.string(), value: z.number() })).min(1),
        caption: z.string(),
      }),
    )
    .min(1),
});

export type DataStoryProps = z.infer<typeof dataStorySchema>;

export const dataStoryDefaults: DataStoryProps = {
  title: "How our users rendered in 2026",
  sections: [
    {
      kind: "stat",
      data: [{ label: "Videos rendered this year", value: 1284000 }],
      caption: "Up from 310,000 last year",
    },
    {
      kind: "bar",
      data: [
        { label: "Shorts", value: 58 },
        { label: "Tutorials", value: 21 },
        { label: "Launches", value: 13 },
        { label: "Podcasts", value: 8 },
      ],
      caption: "What people make, in percent",
    },
    {
      kind: "line",
      data: [
        { label: "Jan", value: 40 },
        { label: "Mar", value: 62 },
        { label: "May", value: 85 },
        { label: "Jul", value: 120 },
        { label: "Sep", value: 164 },
      ],
      caption: "Renders per day, in thousands",
    },
    {
      kind: "donut",
      data: [
        { label: "16:9", value: 44 },
        { label: "9:16", value: 41 },
        { label: "1:1", value: 15 },
      ],
      caption: "Formats",
    },
  ],
};

export function dataStoryStory(props: DataStoryProps): Story {
  return templateStory(props, [
    { type: "title", title: props.title, background: "grid" },
    ...props.sections.map(
      (section): Scene =>
        section.kind === "stat"
          ? { type: "stat", label: section.data[0].label, value: section.data[0].value, caption: section.caption }
          : { type: "chart", kind: section.kind, title: section.caption, data: section.data },
    ),
  ]);
}

export function DataStory(props: DataStoryProps) {
  return <Storyboard story={dataStoryStory(props)} />;
}

export const dataStoryMetadata = templateMetadata(dataStoryStory);
