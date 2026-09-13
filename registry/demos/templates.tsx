import type React from "react";
import { AppPromo, appPromoDefaults, appPromoStory } from "../items/app-promo";
import { Changelog, changelogDefaults, changelogStory } from "../items/changelog";
import { FeatureShort, featureShortDefaults, featureShortStory } from "../items/feature-short";
import { ProductLaunch, productLaunchDefaults, productLaunchStory } from "../items/product-launch";
import type { Story } from "../items/story";
import { storyFrames } from "../items/story";
import { Storyboard } from "../items/storyboard";
import type { Demo } from "./index";
import { sampleStory, sceneTour } from "./story-samples";

const storyboardDemos: Demo[] = [
  {
    id: "storyboard",
    duration: storyFrames(sampleStory),
    bare: true,
    component: () => <Storyboard story={sampleStory} />,
  },
  ...sceneTour.map(
    (story, index): Demo => ({
      id: `storyboard-tour-${index + 1}`,
      duration: storyFrames(story),
      bare: true,
      component: () => <Storyboard story={story} />,
    }),
  ),
];

/** A story-built template at its default props; the demo runs exactly as long as the template's story. */
function storyDemo<P extends object>(
  id: string,
  Template: React.ComponentType<P>,
  toStory: (props: P) => Story,
  props: P,
): Demo {
  return { id, duration: storyFrames(toStory(props)), bare: true, component: () => <Template {...props} /> };
}

const productDemos: Demo[] = [
  storyDemo("product-launch", ProductLaunch, productLaunchStory, productLaunchDefaults),
  storyDemo("feature-short", FeatureShort, featureShortStory, featureShortDefaults),
  storyDemo("changelog", Changelog, changelogStory, changelogDefaults),
  storyDemo("app-promo", AppPromo, appPromoStory, appPromoDefaults),
];

// Tasks 3–5 add one array per template group and list it here.
const demos: Demo[] = [...storyboardDemos, ...productDemos];

export default demos;
