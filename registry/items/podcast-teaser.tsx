/**
 * @title Podcast Teaser
 * @category templates
 * @description Vertical teaser cut from a podcast: one clip of the audio with its waveform, the show, and a pull quote.
 * @duration data-driven
 * @use Promoting an episode with its best thirty seconds
 * @avoid Whole episodes or segments with captions — use `audiogram`
 * @tags podcast, teaser, clip, short, template
 * @example
 * <Composition
 *   id="PodcastTeaser"
 *   component={PodcastTeaser}
 *   schema={podcastTeaserSchema}
 *   defaultProps={{ ...podcastTeaserDefaults, audio: staticFile("episode-42.mp3"), clipStart: 734, clipEnd: 762 }}
 *   calculateMetadata={podcastTeaserMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { AudiogramLayout } from "./audiogram";
import { STORY_FPS } from "./story";
import { TemplateFrame, templateSchema } from "./storyboard";

export const podcastTeaserSchema = templateSchema
  .extend({
    /** The episode audio. Beat-driven bars stand in when omitted. */
    audio: z.string().optional(),
    /** Seconds into the audio where the clip starts. */
    clipStart: z.number().min(0),
    /** Seconds into the audio where the clip ends. */
    clipEnd: z.number().positive(),
    quote: z.string(),
    show: z.string(),
    cover: z.string().optional(),
  })
  .refine((props) => props.clipEnd > props.clipStart, {
    message: "clipEnd must be after clipStart",
    path: ["clipEnd"],
  });

export type PodcastTeaserProps = z.infer<typeof podcastTeaserSchema>;

export const podcastTeaserDefaults: PodcastTeaserProps = {
  clipStart: 0,
  clipEnd: 8,
  quote: "The best render farm is the one you never have to think about.",
  show: "Frame by Frame",
};

export function PodcastTeaser({ audio, clipStart, quote, show, cover, ...fields }: PodcastTeaserProps) {
  return (
    <TemplateFrame fields={fields}>
      <AudiogramLayout audio={audio} clipStart={clipStart} show={show} cover={cover} quote={quote} />
    </TemplateFrame>
  );
}

export const podcastTeaserMetadata: CalculateMetadataFunction<PodcastTeaserProps> = ({ props }) => ({
  durationInFrames: Math.round((props.clipEnd - props.clipStart) * STORY_FPS),
});
