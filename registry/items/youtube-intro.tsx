/**
 * @title YouTube Intro
 * @category templates
 * @description Channel opener: the channel mark, then the video's title, joined by an accent sweep.
 * @duration data-driven
 * @use The first seconds of a YouTube video or a series episode
 * @avoid End cards — use `youtube-outro`
 * @tags youtube, intro, opener, channel, template
 * @example
 * <Composition
 *   id="YoutubeIntro"
 *   component={YoutubeIntro}
 *   schema={youtubeIntroSchema}
 *   defaultProps={youtubeIntroDefaults}
 *   calculateMetadata={youtubeIntroMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const youtubeIntroSchema = templateSchema.extend({
  channel: z.string(),
  title: z.string(),
  /** Channel logo image. Falls back to `brand.logo`, then to the channel name alone. */
  logo: z.string().optional(),
});

export type YoutubeIntroProps = z.infer<typeof youtubeIntroSchema>;

export const youtubeIntroDefaults: YoutubeIntroProps = {
  channel: "Northwind Labs",
  title: "Building a render farm in an afternoon",
};

export function youtubeIntroStory(props: YoutubeIntroProps): Story {
  return templateStory(
    props,
    [
      { type: "logo", text: props.channel, src: props.logo, background: "gradient-mesh", duration: 2 },
      { type: "title", kicker: props.channel, title: props.title, background: "gradient-mesh" },
    ],
    "brand-sweep",
  );
}

export function YoutubeIntro(props: YoutubeIntroProps) {
  return <Storyboard story={youtubeIntroStory(props)} />;
}

export const youtubeIntroMetadata = templateMetadata(youtubeIntroStory);
