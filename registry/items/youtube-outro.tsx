/**
 * @title YouTube Outro
 * @category templates
 * @description Ten-second end card with a next-video slot and a subscribe slot, sized for YouTube's end-screen elements.
 * @duration data-driven
 * @use The last seconds of a YouTube video
 * @avoid Openers — use `youtube-intro`
 * @tags youtube, outro, end screen, subscribe, template
 * @example
 * <Composition
 *   id="YoutubeOutro"
 *   component={YoutubeOutro}
 *   schema={youtubeOutroSchema}
 *   defaultProps={youtubeOutroDefaults}
 *   calculateMetadata={youtubeOutroMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { type CalculateMetadataFunction, Img } from "remotion";
import { z } from "zod";
import { BrandSolid } from "./brand-solid";
import { EndScreen } from "./end-screen";
import { STORY_FPS } from "./story";
import { TemplateFrame, templateSchema } from "./storyboard";

/** YouTube end screens run 5 to 20 seconds; ten leaves time to click. */
const OUTRO_SECONDS = 10;
export const YOUTUBE_OUTRO_FRAMES = OUTRO_SECONDS * STORY_FPS;

export const youtubeOutroSchema = templateSchema.extend({
  nextVideoTitle: z.string(),
  /** Thumbnail of the next video. A placeholder frame is drawn when omitted. */
  thumbnail: z.string().optional(),
  /** Channel name for the subscribe slot. */
  subscribe: z.string().optional(),
});

export type YoutubeOutroProps = z.infer<typeof youtubeOutroSchema>;

export const youtubeOutroDefaults: YoutubeOutroProps = {
  nextVideoTitle: "How we render ten thousand videos a day",
  subscribe: "Northwind Labs",
};

export function YoutubeOutro({ nextVideoTitle, thumbnail, subscribe, ...fields }: YoutubeOutroProps) {
  return (
    <TemplateFrame fields={fields}>
      <BrandSolid />
      <EndScreen
        nextTitle={nextVideoTitle}
        channel={subscribe}
        seconds={OUTRO_SECONDS - 2}
        thumbnail={
          thumbnail ? <Img src={thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : undefined
        }
      />
    </TemplateFrame>
  );
}

export const youtubeOutroMetadata: CalculateMetadataFunction<YoutubeOutroProps> = () => ({
  fps: STORY_FPS,
  durationInFrames: YOUTUBE_OUTRO_FRAMES,
});
