/**
 * @title Feature Short
 * @category templates
 * @description Vertical short about one feature: a hook, the feature in a line, the feature running on a phone, and a call to action.
 * @duration data-driven
 * @use Social shorts that show off a single feature
 * @use Weekly "did you know" clips for a product
 * @avoid A full product story — use `product-launch`
 * @tags short, feature, product, vertical, template
 * @example
 * <Composition
 *   id="FeatureShort"
 *   component={FeatureShort}
 *   schema={featureShortSchema}
 *   defaultProps={featureShortDefaults}
 *   calculateMetadata={featureShortMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const featureShortSchema = templateSchema.extend({
  /** First line on screen; it has three seconds to earn the next. */
  hook: z.string(),
  feature: z.string(),
  /** Screen recording or screenshot of the feature. A placeholder screen stands in when omitted. */
  demo: z.string().optional(),
  cta: z.string(),
});

export type FeatureShortProps = z.infer<typeof featureShortSchema>;

export const featureShortDefaults: FeatureShortProps = {
  hook: "Stop writing release notes by hand",
  feature: "Relay drafts them from your merged pull requests",
  cta: "Try Relay free",
};

export function featureShortStory(props: FeatureShortProps): Story {
  return templateStory(props, [
    { type: "text", text: props.hook, background: "aurora" },
    { type: "title", title: props.feature },
    { type: "device", device: "phone", src: props.demo },
    { type: "cta", title: props.cta },
  ]);
}

export function FeatureShort(props: FeatureShortProps) {
  return <Storyboard story={featureShortStory(props)} />;
}

export const featureShortMetadata = templateMetadata(featureShortStory);
