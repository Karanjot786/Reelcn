import { Captions, type CaptionsVariant } from "../items/captions";
import { ChapterTitle } from "../items/chapter-title";
import { CommentBubble } from "../items/comment-bubble";
import { Center } from "../items/core";
import { Countdown } from "../items/countdown";
import { EndScreen } from "../items/end-screen";
import { FollowCard } from "../items/follow-card";
import { HookTitle } from "../items/hook-title";
import { LowerThird } from "../items/lower-third";
import { PostCard } from "../items/post-card";
import { QuoteCard } from "../items/quote-card";
import { SubscribeCta } from "../items/subscribe-cta";
import { captionFixture } from "./captions-fixture";
import type { Demo } from "./index";

const lowerThirdDemos: Demo[] = (["bar", "card", "minimal"] as const).map(
  (variant): Demo => ({
    id: `lower-third-${variant}`,
    duration: 90,
    component: () => <LowerThird name="Maya Chen" title="Founder, Northwind" variant={variant} />,
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

const socialDemos: Demo[] = [
  {
    id: "hook-title",
    duration: 90,
    component: () => <HookTitle text="Nobody tells you this about lighting" kicker="Part 3" />,
  },
  { id: "subscribe-cta", duration: 90, component: () => <SubscribeCta /> },
  {
    id: "end-screen",
    duration: 120,
    component: () => <EndScreen title="Watch this next" nextTitle="How we cut render times in half" seconds={8} />,
  },
  { id: "chapter-title", duration: 90, component: () => <ChapterTitle number={2} title="Setting the key light" /> },
  {
    id: "post-card",
    duration: 110,
    component: () => (
      <Center>
        <PostCard
          name="Maya Chen"
          handle="@mayachen"
          time="2h"
          text="Shipped the first render pipeline today. One timeline, three formats, no re-cuts."
          metrics={{ likes: 1248, comments: 86, shares: 210 }}
        />
      </Center>
    ),
  },
  {
    id: "quote-card",
    duration: 110,
    component: () => (
      <Center>
        {/* biome-ignore lint/a11y/useValidAriaRole: role is QuoteCard's job-title prop, not an ARIA role */}
        <QuoteCard
          quote="We cut a week of editing down to an afternoon."
          name="Grace Hopper"
          role="Head of Video, Northwind"
        />
      </Center>
    ),
  },
  { id: "countdown", duration: 180, component: () => <Countdown seconds={5} label="Starting in" /> },
  {
    id: "comment-bubble",
    duration: 110,
    component: () => (
      <Center>
        <CommentBubble
          name="Katherine"
          handle="@kj"
          text="Which mic is that? It sounds unreal."
          replyTo="Ada"
          likes={42}
        />
      </Center>
    ),
  },
  {
    id: "follow-card",
    duration: 110,
    component: () => (
      <Center>
        <FollowCard name="Maya Chen" handle="@mayachen" followers="24.8k" />
      </Center>
    ),
  },
];

export default [...lowerThirdDemos, ...captionDemos, ...socialDemos];
