/**
 * @title Testimonial Reel
 * @category templates
 * @description Square reel of customer quotes, one card per testimonial, pushed in one after another.
 * @duration data-driven
 * @use Social proof for a landing page or an ad
 * @use Collecting launch-day reactions into one clip
 * @avoid One quote on its own — use `quote-card`
 * @tags testimonials, quotes, social proof, template
 * @example
 * <Composition
 *   id="TestimonialReel"
 *   component={TestimonialReel}
 *   schema={testimonialReelSchema}
 *   defaultProps={testimonialReelDefaults}
 *   calculateMetadata={testimonialReelMetadata}
 *   width={1080}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const testimonialReelSchema = templateSchema.extend({
  testimonials: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
        role: z.string(),
        /** Avatar image. Initials are drawn when omitted. */
        avatar: z.string().optional(),
      }),
    )
    .min(1),
});

export type TestimonialReelProps = z.infer<typeof testimonialReelSchema>;

export const testimonialReelDefaults: TestimonialReelProps = {
  testimonials: [
    {
      quote: "We cut our launch video from two weeks to one afternoon.",
      name: "Maya Chen",
      role: "Head of product, Northwind",
    },
    { quote: "Our changelog finally gets watched instead of skipped.", name: "Tomás Rivera", role: "Founder, Pace" },
    {
      quote: "The whole team edits the JSON. Nobody waits on a video editor.",
      name: "Priya Nair",
      role: "Design lead, Relay",
    },
  ],
};

export function testimonialReelStory(props: TestimonialReelProps): Story {
  return templateStory(
    props,
    props.testimonials.map(
      (t): Scene => ({ type: "quote", quote: t.quote, name: t.name, role: t.role, avatar: t.avatar }),
    ),
    "card-push",
  );
}

export function TestimonialReel(props: TestimonialReelProps) {
  return <Storyboard story={testimonialReelStory(props)} />;
}

export const testimonialReelMetadata = templateMetadata(testimonialReelStory);
