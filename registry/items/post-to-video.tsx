/**
 * @title Post to Video
 * @category templates
 * @description Turns one social post into a vertical video: the post card builds in, its text reveals and its counts climb.
 * @duration data-driven
 * @use Reposting a popular post as a short
 * @use Quoting a customer's public post in a video
 * @avoid Several posts in a row — use `storyboard` with post scenes
 * @tags social, post, repost, short, template
 * @example
 * <Composition
 *   id="PostToVideo"
 *   component={PostToVideo}
 *   schema={postToVideoSchema}
 *   defaultProps={postToVideoDefaults}
 *   calculateMetadata={postToVideoMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const postToVideoSchema = templateSchema.extend({
  author: z.string(),
  handle: z.string().optional(),
  /** Avatar image. Initials are drawn when omitted. */
  avatar: z.string().optional(),
  text: z.string(),
  metrics: z
    .object({ likes: z.number().optional(), comments: z.number().optional(), shares: z.number().optional() })
    .optional(),
});

export type PostToVideoProps = z.infer<typeof postToVideoSchema>;

export const postToVideoDefaults: PostToVideoProps = {
  author: "Maya Chen",
  handle: "@mayachen",
  text: "We replaced a two-week video process with a JSON file and an afternoon. The first cut shipped the same day.",
  metrics: { likes: 18400, comments: 932, shares: 2100 },
};

export function postToVideoStory(props: PostToVideoProps): Story {
  const { author, handle, avatar, text, metrics } = props;
  return templateStory(props, [{ type: "post", name: author, handle, avatar, text, metrics, background: "dots" }]);
}

export function PostToVideo(props: PostToVideoProps) {
  return <Storyboard story={postToVideoStory(props)} />;
}

export const postToVideoMetadata = templateMetadata(postToVideoStory);
