/**
 * @title Changelog
 * @category templates
 * @description Release video listing what is new, improved and fixed in a version, three changes per card set.
 * @duration data-driven
 * @use Monthly or per-release update videos
 * @use Turning a changelog page into something people watch
 * @avoid A whole product story — use `product-launch`
 * @tags changelog, release, updates, product, template
 * @example
 * <Composition
 *   id="Changelog"
 *   component={Changelog}
 *   schema={changelogSchema}
 *   defaultProps={changelogDefaults}
 *   calculateMetadata={changelogMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { chunk, Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

const LABELS = { new: "New", improved: "Improved", fixed: "Fixed" } as const;

export const changelogSchema = templateSchema.extend({
  version: z.string(),
  date: z.string(),
  items: z.array(z.object({ type: z.enum(["new", "improved", "fixed"]), text: z.string() })).min(1),
  url: z.string().optional(),
});

export type ChangelogProps = z.infer<typeof changelogSchema>;

export const changelogDefaults: ChangelogProps = {
  version: "2.4",
  date: "September 2026",
  items: [
    { type: "new", text: "Scheduled releases" },
    { type: "new", text: "A weekly digest in your team chat" },
    { type: "improved", text: "The editor opens twice as fast" },
    { type: "improved", text: "A calmer diff view" },
    { type: "fixed", text: "Links in footnotes open correctly" },
  ],
  url: "relay.example.com/changelog",
};

export function changelogStory(props: ChangelogProps): Story {
  const { version, date, items, url } = props;
  return templateStory(props, [
    { type: "title", kicker: "Changelog", title: `Version ${version}`, subtitle: date, background: "grid" },
    ...chunk(items, 3).map(
      (group): Scene => ({
        type: "bullets",
        items: group.map((item) => ({ text: item.text, badge: LABELS[item.type] })),
      }),
    ),
    { type: "cta", title: "Available today", url },
  ]);
}

export function Changelog(props: ChangelogProps) {
  return <Storyboard story={changelogStory(props)} />;
}

export const changelogMetadata = templateMetadata(changelogStory);
