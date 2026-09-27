import type React from "react";
import { staticFile } from "remotion";
import { AiGeneration, aiGenerationDefaults } from "../items/ai-generation";
import { AppPromo, appPromoDefaults, appPromoStory } from "../items/app-promo";
import { Audiogram, audiogramDefaults } from "../items/audiogram";
import { BrandReel, brandReelDefaults } from "../items/brand-reel";
import { Changelog, changelogDefaults, changelogStory } from "../items/changelog";
import { CodeLive, codeLiveDefaults } from "../items/code-live";
import { DataStory, dataStoryDefaults, dataStoryStory } from "../items/data-story";
import { FeatureShort, featureShortDefaults, featureShortStory } from "../items/feature-short";
import { ListicleShort, listicleShortDefaults, listicleShortStory } from "../items/listicle-short";
import { PodcastTeaser, podcastTeaserDefaults } from "../items/podcast-teaser";
import { PostToVideo, postToVideoDefaults, postToVideoStory } from "../items/post-to-video";
import { ProductLaunch, productLaunchDefaults, productLaunchScenes, productLaunchStory } from "../items/product-launch";
import { Standings, standingsDefaults } from "../items/standings";
import type { CustomSceneRule, Story } from "../items/story";
import { captionsSeconds, storyFrames } from "../items/story";
import { Storyboard } from "../items/storyboard";
import { TalkingHeadShort, talkingHeadShortDefaults } from "../items/talking-head-short";
import { TestimonialReel, testimonialReelDefaults, testimonialReelStory } from "../items/testimonial-reel";
import { Tutorial, tutorialDefaults, tutorialStory } from "../items/tutorial";
import { YoutubeIntro, youtubeIntroDefaults, youtubeIntroStory } from "../items/youtube-intro";
import { YOUTUBE_OUTRO_FRAMES, YoutubeOutro, youtubeOutroDefaults } from "../items/youtube-outro";
import { captionFixture } from "./captions-fixture";
import { customizable } from "./customizable";
import type { Demo } from "./index";
import { sceneMarks } from "./scene-marks";
import { sampleStory, sceneTour } from "./story-samples";

const storyboardDemos: Demo[] = [
  {
    id: "storyboard",
    duration: storyFrames(sampleStory),
    bare: true,
    scenes: sceneMarks(sampleStory),
    story: sampleStory,
    ...customizable("Storyboard", Storyboard, { story: sampleStory }),
  },
  ...sceneTour.map(
    (story, index): Demo => ({
      id: `storyboard-tour-${index + 1}`,
      duration: storyFrames(story),
      bare: true,
      scenes: sceneMarks(story),
      story,
      component: () => <Storyboard story={story} />,
    }),
  ),
];

/**
 * A story-built template at its default props; the demo runs exactly as long as the template's story. `custom` is the
 * template's own scene rules, when its story mixes in `defineScene` types.
 */
function storyDemo<P extends object>(
  id: string,
  name: string,
  Template: React.ComponentType<P>,
  toStory: (props: P) => Story,
  props: P,
  custom: CustomSceneRule[] = [],
): Demo {
  const story = toStory(props);
  return {
    id,
    duration: storyFrames(story, custom),
    bare: true,
    scenes: sceneMarks(story, custom),
    story,
    // ponytail: duration is the demo's; editing the scene list in Customize doesn't retime the preview.
    ...customizable(name, Template, props),
  };
}

// brand-reel's story mixes in two template-local `defineScene` types ("brand-palette",
// "brand-collage"), which `storyDemo`'s `storyFrames`/`sceneMarks` calls don't know about
// (they take no custom-scene rules) — so, like `product.tsx`'s own `ui`-scene demo, this is a
// plain literal-duration entry instead of `storyDemo`, with its own named component function.
const BRAND_COLLAGE = [
  staticFile("reelcn-demo/screenshots/fictional-analytics.webp"),
  staticFile("reelcn-demo/screenshots/fictional-mobile-feed.webp"),
  staticFile("reelcn-demo/screenshots/reelcn-docs.webp"),
];

const productDemos: Demo[] = [
  storyDemo(
    "product-launch",
    "ProductLaunch",
    ProductLaunch,
    productLaunchStory,
    productLaunchDefaults,
    productLaunchScenes,
  ),
  storyDemo("feature-short", "FeatureShort", FeatureShort, featureShortStory, featureShortDefaults),
  storyDemo("changelog", "Changelog", Changelog, changelogStory, changelogDefaults),
  storyDemo("app-promo", "AppPromo", AppPromo, appPromoStory, appPromoDefaults),
  {
    id: "brand-reel",
    duration: 285,
    bare: true,
    ...customizable("BrandReel", BrandReel, { ...brandReelDefaults, collage: BRAND_COLLAGE }, undefined, {
      collage:
        '[\n  staticFile("reelcn-demo/screenshots/fictional-analytics.webp"),\n  staticFile("reelcn-demo/screenshots/fictional-mobile-feed.webp"),\n  staticFile("reelcn-demo/screenshots/reelcn-docs.webp"),\n]',
    }),
  },
  {
    id: "ai-generation",
    duration: 180,
    bare: true,
    ...customizable("AiGeneration", AiGeneration, { ...aiGenerationDefaults }),
  },
  {
    id: "code-live",
    duration: 180,
    bare: true,
    ...customizable(
      "CodeLive",
      CodeLive,
      {
        ...codeLiveDefaults,
        previews: [
          { atLine: 2, src: staticFile("reelcn-demo/screenshots/fictional-analytics.webp") },
          { atLine: 6, src: staticFile("reelcn-demo/screenshots/reelcn-docs.webp") },
        ],
      },
      undefined,
      {
        previews:
          '[\n  { atLine: 2, src: staticFile("reelcn-demo/screenshots/fictional-analytics.webp") },\n  { atLine: 6, src: staticFile("reelcn-demo/screenshots/reelcn-docs.webp") },\n]',
      },
    ),
  },
  { id: "standings", duration: 138, bare: true, ...customizable("Standings", Standings, { ...standingsDefaults }) },
];

const creatorDemos: Demo[] = [
  storyDemo("youtube-intro", "YoutubeIntro", YoutubeIntro, youtubeIntroStory, youtubeIntroDefaults),
  {
    id: "youtube-outro",
    duration: YOUTUBE_OUTRO_FRAMES,
    bare: true,
    ...customizable("YoutubeOutro", YoutubeOutro, { ...youtubeOutroDefaults }),
  },
  {
    id: "talking-head-short",
    duration: Math.ceil(30 * captionsSeconds(captionFixture, 6)),
    bare: true,
    ...customizable(
      "TalkingHeadShort",
      TalkingHeadShort,
      { ...talkingHeadShortDefaults, captions: captionFixture, emphasize: ["three"] },
      undefined,
      { captions: "captionFixture" },
    ),
  },
  {
    // clip.mp4 is 4 s long.
    id: "talking-head-short-video",
    duration: 120,
    bare: true,
    component: () => <TalkingHeadShort {...talkingHeadShortDefaults} video={staticFile("reelcn-demo/clip.mp4")} />,
  },
  storyDemo("post-to-video", "PostToVideo", PostToVideo, postToVideoStory, postToVideoDefaults),
  storyDemo("listicle-short", "ListicleShort", ListicleShort, listicleShortStory, listicleShortDefaults),
];

const podcastDataDemos: Demo[] = [
  {
    // voice.mp3 is 6 s long.
    id: "audiogram",
    duration: 180,
    bare: true,
    ...customizable(
      "Audiogram",
      Audiogram,
      { ...audiogramDefaults, audio: staticFile("reelcn-demo/voice.mp3"), captions: captionFixture },
      undefined,
      { audio: 'staticFile("reelcn-demo/voice.mp3")', captions: "captionFixture" },
    ),
  },
  { id: "audiogram-silent", duration: 240, bare: true, component: () => <Audiogram {...audiogramDefaults} /> },
  {
    id: "podcast-teaser",
    duration: 120,
    bare: true,
    ...customizable(
      "PodcastTeaser",
      PodcastTeaser,
      { ...podcastTeaserDefaults, audio: staticFile("reelcn-demo/voice.mp3"), clipStart: 1, clipEnd: 5 },
      undefined,
      { audio: 'staticFile("reelcn-demo/voice.mp3")' },
    ),
  },
  storyDemo("data-story", "DataStory", DataStory, dataStoryStory, dataStoryDefaults),
  storyDemo("testimonial-reel", "TestimonialReel", TestimonialReel, testimonialReelStory, testimonialReelDefaults),
  storyDemo("tutorial", "Tutorial", Tutorial, tutorialStory, tutorialDefaults),
];

// Tasks 3–5 add one array per template group and list it here.
const demos: Demo[] = [...storyboardDemos, ...productDemos, ...creatorDemos, ...podcastDataDemos];

export default demos;
