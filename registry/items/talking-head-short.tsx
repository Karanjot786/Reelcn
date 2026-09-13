/**
 * @title Talking Head Short
 * @category templates
 * @description Vertical talking-head clip with a three-second hook and word-by-word captions, running as long as the video.
 * @duration data-driven
 * @use Turning a recorded explanation or interview answer into a short
 * @use Captioned clips for feeds that autoplay muted
 * @avoid Captions over a layout you build yourself — use `captions`
 * @tags short, captions, talking head, creator, template
 * @example
 * <Composition
 *   id="TalkingHeadShort"
 *   component={TalkingHeadShort}
 *   schema={talkingHeadShortSchema}
 *   defaultProps={{ ...talkingHeadShortDefaults, video: staticFile("take-3.mp4"), captions }}
 *   calculateMetadata={talkingHeadShortMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { Video } from "@remotion/media";
import { AbsoluteFill, type CalculateMetadataFunction, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { Captions } from "./captions";
import { useViewport } from "./core";
import { GradientMesh } from "./gradient-mesh";
import { HookTitle } from "./hook-title";
import { captionSchema, captionsSeconds, STORY_FPS } from "./story";
import { mediaSeconds, TemplateFrame, templateSchema } from "./storyboard";

export const talkingHeadShortSchema = templateSchema.extend({
  /** The recording. A moving background stands in when omitted. */
  video: z.string().optional(),
  /** Word-level captions; `reelcn-transcribe` writes them from the video. */
  captions: z.array(captionSchema),
  /** Line shown over the first three seconds. */
  hook: z.string(),
  /** Words painted in the emphasis color. */
  emphasize: z.array(z.string()),
});

export type TalkingHeadShortProps = z.infer<typeof talkingHeadShortSchema>;

const SAMPLE: [string, number, number][] = [
  ["Here", 0, 300],
  ["is", 300, 450],
  ["the", 450, 600],
  ["one", 600, 900],
  ["thing", 900, 1250],
  ["that", 1250, 1450],
  ["keeps", 1450, 1800],
  ["people", 1800, 2200],
  ["watching.", 2200, 2800],
];

export const talkingHeadShortDefaults: TalkingHeadShortProps = {
  hook: "Most videos lose you in three seconds",
  captions: SAMPLE.map(([text, startMs, endMs]) => ({
    text: `${text} `,
    startMs,
    endMs,
    timestampMs: startMs,
    confidence: 1,
  })),
  emphasize: ["watching."],
};

export function TalkingHeadShort({ video, captions, hook, emphasize, ...fields }: TalkingHeadShortProps) {
  const { fps } = useVideoConfig();
  const { safe } = useViewport();
  return (
    <TemplateFrame fields={fields}>
      <AbsoluteFill>
        {video ? <Video src={video} objectFit="cover" style={{ width: "100%", height: "100%" }} /> : <GradientMesh />}
      </AbsoluteFill>
      <Sequence durationInFrames={3 * fps}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: safe.top }}>
          <HookTitle text={hook} />
        </AbsoluteFill>
      </Sequence>
      <Captions captions={captions} emphasize={emphasize} />
    </TemplateFrame>
  );
}

/** As long as the video; without one, as long as the captions. */
export const talkingHeadShortMetadata: CalculateMetadataFunction<TalkingHeadShortProps> = async ({ props }) => ({
  durationInFrames: Math.ceil(
    STORY_FPS * (props.video ? await mediaSeconds(props.video) : captionsSeconds(props.captions, 6)),
  ),
});
