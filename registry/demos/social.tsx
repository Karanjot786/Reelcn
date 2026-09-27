import { Captions } from "../items/captions";
import { CaptionsBoldPop } from "../items/captions-bold-pop";
import { CaptionsBoxed } from "../items/captions-boxed";
import { CaptionsHighlightBox } from "../items/captions-highlight-box";
import { CaptionsKaraoke } from "../items/captions-karaoke";
import { CaptionsMinimal } from "../items/captions-minimal";
import { CaptionsNeon } from "../items/captions-neon";
import { CaptionsSubtitleBar } from "../items/captions-subtitle-bar";
import { CaptionsWordStack } from "../items/captions-word-stack";
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
import { customizable } from "./customizable";
import type { Demo } from "./index";

const lowerThirdDemos: Demo[] = (["bar", "card", "minimal"] as const).map(
  (variant): Demo => ({
    id: `lower-third-${variant}`,
    duration: 90,
    ...customizable("LowerThird", LowerThird, { name: "Maya Chen", title: "Founder, Northwind", variant }),
  }),
);

// Each caption style is its own item: the demo renders that item's component, so its page customizes it.
const captionVariants = {
  "bold-pop": ["CaptionsBoldPop", CaptionsBoldPop],
  karaoke: ["CaptionsKaraoke", CaptionsKaraoke],
  boxed: ["CaptionsBoxed", CaptionsBoxed],
  minimal: ["CaptionsMinimal", CaptionsMinimal],
  neon: ["CaptionsNeon", CaptionsNeon],
  "word-stack": ["CaptionsWordStack", CaptionsWordStack],
  "subtitle-bar": ["CaptionsSubtitleBar", CaptionsSubtitleBar],
  "highlight-box": ["CaptionsHighlightBox", CaptionsHighlightBox],
} as const;

const captionDemos: Demo[] = [
  {
    id: "captions-emphasis",
    duration: 200,
    ...customizable("Captions", Captions, { captions: captionFixture, emphasize: ["three", "seconds."] }),
  },
  ...Object.entries(captionVariants).map(
    ([variant, [name, Component]]): Demo => ({
      id: `captions-${variant}`,
      duration: 200,
      ...customizable(name, Component, { captions: captionFixture, emphasize: ["three"] }, undefined, {
        captions: "captionFixture",
      }),
    }),
  ),
];

const socialDemos: Demo[] = [
  {
    id: "hook-title",
    duration: 90,
    ...customizable("HookTitle", HookTitle, { text: "Nobody tells you this about lighting", kicker: "Part 3" }),
  },
  { id: "subscribe-cta", duration: 90, ...customizable("SubscribeCta", SubscribeCta, {}) },
  {
    id: "end-screen",
    duration: 120,
    ...customizable("EndScreen", EndScreen, {
      title: "Watch this next",
      nextTitle: "How we cut render times in half",
      seconds: 8,
    }),
  },
  {
    id: "chapter-title",
    duration: 90,
    ...customizable("ChapterTitle", ChapterTitle, { number: 2, title: "Setting the key light" }),
  },
  {
    id: "post-card",
    duration: 110,
    ...customizable(
      "PostCard",
      PostCard,
      {
        name: "Maya Chen",
        handle: "@mayachen",
        time: "2h",
        text: "Shipped the first render pipeline today. One timeline, three formats, no re-cuts.",
        metrics: { likes: 1248, comments: 86, shares: 210 },
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "quote-card",
    duration: 110,
    ...customizable(
      "QuoteCard",
      QuoteCard,
      {
        quote: "We cut a week of editing down to an afternoon.",
        name: "Grace Hopper",
        role: "Head of Video, Northwind",
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  { id: "countdown", duration: 180, ...customizable("Countdown", Countdown, { seconds: 5, label: "Starting in" }) },
  {
    id: "comment-bubble",
    duration: 110,
    ...customizable(
      "CommentBubble",
      CommentBubble,
      { name: "Katherine", handle: "@kj", text: "Which mic is that? It sounds unreal.", replyTo: "Ada", likes: 42 },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "follow-card",
    duration: 110,
    ...customizable(
      "FollowCard",
      FollowCard,
      { name: "Maya Chen", handle: "@mayachen", followers: "24.8k" },
      (element) => <Center>{element}</Center>,
    ),
  },
];

export default [...lowerThirdDemos, ...captionDemos, ...socialDemos];
