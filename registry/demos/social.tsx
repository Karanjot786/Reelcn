import { Captions, type CaptionsVariant } from "../items/captions";
import { LowerThird } from "../items/lower-third";
import { captionFixture } from "./captions-fixture";
import type { Demo } from "./index";

const lowerThirdDemos: Demo[] = (["bar", "card", "minimal"] as const).map(
  (variant): Demo => ({
    id: `lower-third-${variant}`,
    duration: 90,
    component: () => <LowerThird name="Ada Lovelace" title="Founder, Analytical Engines" variant={variant} />,
  }),
);

const captionVariants: CaptionsVariant[] = [
  "bold-pop",
  "karaoke",
  "boxed",
  "minimal",
  "neon",
  "word-stack",
  "subtitle-bar",
  "highlight-box",
];

const captionDemos: Demo[] = [
  {
    id: "captions-emphasis",
    duration: 200,
    component: () => <Captions captions={captionFixture} emphasize={["three", "seconds."]} />,
  },
  ...captionVariants.map(
    (variant): Demo => ({
      id: `captions-${variant}`,
      duration: 200,
      component: () => <Captions captions={captionFixture} variant={variant} emphasize={["three"]} />,
    }),
  ),
];

export default [...lowerThirdDemos, ...captionDemos];
