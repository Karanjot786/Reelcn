import { demos } from "@reelcn/registry/demos";
import { sampleStory } from "@reelcn/registry/demos/story-samples";
import { DemoFrame } from "@reelcn/registry/demos/view";
import { AppPromo, appPromoDefaults, appPromoMetadata, appPromoSchema } from "@reelcn/registry/items/app-promo";
import { Audiogram, audiogramDefaults, audiogramMetadata, audiogramSchema } from "@reelcn/registry/items/audiogram";
import { Changelog, changelogDefaults, changelogMetadata, changelogSchema } from "@reelcn/registry/items/changelog";
import { type ThemeName, themeNames, Viewport } from "@reelcn/registry/items/core";
import { DataStory, dataStoryDefaults, dataStoryMetadata, dataStorySchema } from "@reelcn/registry/items/data-story";
import {
  FeatureShort,
  featureShortDefaults,
  featureShortMetadata,
  featureShortSchema,
} from "@reelcn/registry/items/feature-short";
import {
  ListicleShort,
  listicleShortDefaults,
  listicleShortMetadata,
  listicleShortSchema,
} from "@reelcn/registry/items/listicle-short";
import {
  PodcastTeaser,
  podcastTeaserDefaults,
  podcastTeaserMetadata,
  podcastTeaserSchema,
} from "@reelcn/registry/items/podcast-teaser";
import {
  PostToVideo,
  postToVideoDefaults,
  postToVideoMetadata,
  postToVideoSchema,
} from "@reelcn/registry/items/post-to-video";
import {
  ProductLaunch,
  productLaunchDefaults,
  productLaunchMetadata,
  productLaunchSchema,
} from "@reelcn/registry/items/product-launch";
import { StoryVideo, storyMetadata, storySchema } from "@reelcn/registry/items/storyboard";
import {
  TalkingHeadShort,
  talkingHeadShortDefaults,
  talkingHeadShortMetadata,
  talkingHeadShortSchema,
} from "@reelcn/registry/items/talking-head-short";
import {
  TestimonialReel,
  testimonialReelDefaults,
  testimonialReelMetadata,
  testimonialReelSchema,
} from "@reelcn/registry/items/testimonial-reel";
import { Tutorial, tutorialDefaults, tutorialMetadata, tutorialSchema } from "@reelcn/registry/items/tutorial";
import {
  YoutubeIntro,
  youtubeIntroDefaults,
  youtubeIntroMetadata,
  youtubeIntroSchema,
} from "@reelcn/registry/items/youtube-intro";
import {
  YoutubeOutro,
  youtubeOutroDefaults,
  youtubeOutroMetadata,
  youtubeOutroSchema,
} from "@reelcn/registry/items/youtube-outro";
import { AbsoluteFill, Composition, Folder, Freeze, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { SelfTest } from "./self-test";

export const FORMATS = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] } as const;
export type Format = keyof typeof FORMATS;

const formats = Object.keys(FORMATS) as Format[];
const categories = [...new Set(demos.map((d) => d.category))];
const byId = new Map(demos.map((d) => [d.id, d]));

const demoSchema = z.object({
  demo: z.string(),
  theme: z.enum(themeNames as [ThemeName, ...ThemeName[]]),
  thumbFrame: z.number().optional(),
});
const sheetSchema = demoSchema.extend({ format: z.enum(formats as [Format, ...Format[]]) });

function lookup(id: string) {
  const demo = byId.get(id);
  if (!demo) throw new Error(`Unknown demo "${id}"`);
  return demo;
}

function DemoView({ demo, theme }: z.infer<typeof demoSchema>) {
  return <DemoFrame demo={lookup(demo)} theme={theme} />;
}

const SHEET_CELLS = 9;
const SHEET_COLUMNS = 3;

/** Size and timing for a template composition; its `calculateMetadata` sets the real length. */
const templateSize = (format: Format) => ({
  width: FORMATS[format][0],
  height: FORMATS[format][1],
  fps: 30,
  durationInFrames: 1,
});

/** One still holding nine frozen frames, so motion can be reviewed without watching a render. */
function ContactSheet({ demo, theme, format }: z.infer<typeof sheetSchema>) {
  const [width, height] = FORMATS[format];
  const { duration } = lookup(demo);
  return (
    <AbsoluteFill style={{ background: "#1c1c1c" }}>
      {Array.from({ length: SHEET_CELLS }, (_, cell) => {
        // Skip frame 0 and the last frame: auto-exiting items are invisible on both.
        const frame = Math.round(1 + (cell * Math.max(duration - 3, 0)) / (SHEET_CELLS - 1));
        return (
          <div
            key={cell}
            style={{
              position: "absolute",
              left: (cell % SHEET_COLUMNS) * width,
              top: Math.floor(cell / SHEET_COLUMNS) * height,
              width,
              height,
              overflow: "hidden",
            }}
          >
            <Sequence durationInFrames={duration}>
              <Freeze frame={frame}>
                <Viewport width={width} height={height}>
                  <DemoView demo={demo} theme={theme} />
                </Viewport>
              </Freeze>
            </Sequence>
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                padding: "6px 18px",
                background: "#000c",
                color: "#fff",
                font: "600 44px monospace",
              }}
            >
              f{frame}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function Root() {
  return (
    <>
      <Composition id="self-test" component={SelfTest} durationInFrames={40} fps={30} width={1920} height={1080} />
      <Folder name="Templates">
        <Composition
          id="Storyboard"
          component={StoryVideo}
          schema={storySchema}
          defaultProps={sampleStory}
          calculateMetadata={storyMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="ProductLaunch"
          component={ProductLaunch}
          schema={productLaunchSchema}
          defaultProps={productLaunchDefaults}
          calculateMetadata={productLaunchMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="FeatureShort"
          component={FeatureShort}
          schema={featureShortSchema}
          defaultProps={featureShortDefaults}
          calculateMetadata={featureShortMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="Changelog"
          component={Changelog}
          schema={changelogSchema}
          defaultProps={changelogDefaults}
          calculateMetadata={changelogMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="AppPromo"
          component={AppPromo}
          schema={appPromoSchema}
          defaultProps={appPromoDefaults}
          calculateMetadata={appPromoMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="YoutubeIntro"
          component={YoutubeIntro}
          schema={youtubeIntroSchema}
          defaultProps={youtubeIntroDefaults}
          calculateMetadata={youtubeIntroMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="YoutubeOutro"
          component={YoutubeOutro}
          schema={youtubeOutroSchema}
          defaultProps={youtubeOutroDefaults}
          calculateMetadata={youtubeOutroMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="TalkingHeadShort"
          component={TalkingHeadShort}
          schema={talkingHeadShortSchema}
          defaultProps={talkingHeadShortDefaults}
          calculateMetadata={talkingHeadShortMetadata}
          {...templateSize("9x16")}
        />
        {/* Proves mediaSeconds: the length must come from clip.mp4 (4 s = 120 frames). */}
        <Composition
          id="TalkingHeadShortClip"
          component={TalkingHeadShort}
          schema={talkingHeadShortSchema}
          defaultProps={{ ...talkingHeadShortDefaults, video: staticFile("reelcn-demo/clip.mp4") }}
          calculateMetadata={talkingHeadShortMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="PostToVideo"
          component={PostToVideo}
          schema={postToVideoSchema}
          defaultProps={postToVideoDefaults}
          calculateMetadata={postToVideoMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="ListicleShort"
          component={ListicleShort}
          schema={listicleShortSchema}
          defaultProps={listicleShortDefaults}
          calculateMetadata={listicleShortMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="Audiogram"
          component={Audiogram}
          schema={audiogramSchema}
          defaultProps={audiogramDefaults}
          calculateMetadata={audiogramMetadata}
          {...templateSize("1x1")}
        />
        {/* Proves mediaSeconds on audio: the length must come from voice.mp3 (6 s = 180 frames). */}
        <Composition
          id="AudiogramVoice"
          component={Audiogram}
          schema={audiogramSchema}
          defaultProps={{ ...audiogramDefaults, audio: staticFile("reelcn-demo/voice.mp3") }}
          calculateMetadata={audiogramMetadata}
          {...templateSize("1x1")}
        />
        <Composition
          id="PodcastTeaser"
          component={PodcastTeaser}
          schema={podcastTeaserSchema}
          defaultProps={podcastTeaserDefaults}
          calculateMetadata={podcastTeaserMetadata}
          {...templateSize("9x16")}
        />
        <Composition
          id="DataStory"
          component={DataStory}
          schema={dataStorySchema}
          defaultProps={dataStoryDefaults}
          calculateMetadata={dataStoryMetadata}
          {...templateSize("16x9")}
        />
        <Composition
          id="TestimonialReel"
          component={TestimonialReel}
          schema={testimonialReelSchema}
          defaultProps={testimonialReelDefaults}
          calculateMetadata={testimonialReelMetadata}
          {...templateSize("1x1")}
        />
        <Composition
          id="Tutorial"
          component={Tutorial}
          schema={tutorialSchema}
          defaultProps={tutorialDefaults}
          calculateMetadata={tutorialMetadata}
          {...templateSize("16x9")}
        />
      </Folder>
      {formats.map((format) => (
        <Folder key={format} name={format}>
          {categories.map((category) => (
            <Folder key={category} name={category}>
              {demos
                .filter((demo) => demo.category === category)
                .map((demo) => (
                  <Composition
                    key={demo.id}
                    id={`${demo.id}-${format}`}
                    component={DemoView}
                    schema={demoSchema}
                    defaultProps={{ demo: demo.id, theme: "midnight" as ThemeName, thumbFrame: demo.thumbFrame }}
                    durationInFrames={demo.duration}
                    fps={30}
                    width={FORMATS[format][0]}
                    height={FORMATS[format][1]}
                  />
                ))}
            </Folder>
          ))}
        </Folder>
      ))}
      <Folder name="sheets">
        {demos.flatMap((demo) =>
          formats.map((format) => (
            <Composition
              key={`${demo.id}-${format}`}
              id={`sheet-${demo.id}-${format}`}
              component={ContactSheet}
              schema={sheetSchema}
              defaultProps={{ demo: demo.id, theme: "midnight" as ThemeName, format }}
              // Not a <Still>: that reports fps 1 and durationInFrames 1, which clamps every cell's Sequence
              // to a single frame, leaving <Freeze> nothing to freeze. Only frame 0 is ever rendered.
              durationInFrames={demo.duration}
              fps={30}
              width={FORMATS[format][0] * SHEET_COLUMNS}
              height={FORMATS[format][1] * (SHEET_CELLS / SHEET_COLUMNS)}
            />
          )),
        )}
      </Folder>
    </>
  );
}
