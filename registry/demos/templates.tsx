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

// Tasks 3–5 add one array per template group and list it here.
const demos: Demo[] = [...storyboardDemos];

export default demos;
