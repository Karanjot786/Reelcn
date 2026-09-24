import { staticFile } from "remotion";
import { BlurIn } from "../items/blur-in";
import { CharRise } from "../items/char-rise";
import { Center, ThemeProvider } from "../items/core";
import { Counter } from "../items/counter";
import { DropIn } from "../items/drop-in";
import { FitTitle } from "../items/fit-title";
import { Highlight, type HighlightVariant } from "../items/highlight";
import { LineSlide } from "../items/line-slide";
import { MaskReveal } from "../items/mask-reveal";
import { PopIn } from "../items/pop-in";
import { RiseUp } from "../items/rise-up";
import { Scramble } from "../items/scramble";
import { Stamp } from "../items/stamp";
import { TextMaskVideo } from "../items/text-mask-video";
import { TextMorph } from "../items/text-morph";
import { TextReveal, type TextRevealEffect } from "../items/text-reveal";
import { Typewriter } from "../items/typewriter";
import { WordPush } from "../items/word-push";
import { WordRotator } from "../items/word-rotator";
import { customizable } from "./customizable";
import type { Demo } from "./index";

const effects: TextRevealEffect[] = ["rise", "blur", "fade", "scale", "drop", "mask"];

const highlightVariants: HighlightVariant[] = ["marker", "underline", "box", "circle"];

export default [
  ...effects.map(
    (effect): Demo => ({
      id: `text-reveal-${effect}`,
      duration: 75,
      ...customizable(
        "TextReveal",
        TextReveal,
        { text: "Ship videos, not keyframes", effect, accentWords: ["videos"] },
        (element) => <Center>{element}</Center>,
      ),
    }),
  ),
  {
    id: "text-reveal-chars",
    duration: 75,
    component: () => (
      <Center>
        <TextReveal text="Héllo, wörld" split="char" size={130} />
      </Center>
    ),
  },
  {
    id: "text-reveal-lines",
    duration: 90,
    component: () => (
      <Center>
        <TextReveal text={"Record once.\nRender everywhere."} split="line" effect="mask" align="left" />
      </Center>
    ),
  },
  {
    id: "text-reveal-track",
    duration: 75,
    component: () => (
      <Center>
        <TextReveal text="Ship videos, not keyframes" effect="track" accentWords={["videos"]} />
      </Center>
    ),
  },
  {
    id: "text-reveal-outline-fill",
    duration: 75,
    component: () => (
      <Center>
        <TextReveal text="Ship videos, not keyframes" effect="outline-fill" accentWords={["videos"]} />
      </Center>
    ),
  },
  {
    id: "text-reveal-split-flap",
    duration: 75,
    component: () => (
      <Center>
        <TextReveal text="Ship videos, not keyframes" effect="split-flap" split="char" accentWords={["videos"]} />
      </Center>
    ),
  },
  {
    id: "text-reveal-variable-axis",
    duration: 75,
    component: () => (
      <ThemeProvider theme="mono">
        <Center>
          <TextReveal text="Ship videos, not keyframes" effect="variable-axis" accentWords={["videos"]} />
        </Center>
      </ThemeProvider>
    ),
  },
  {
    id: "typewriter-type",
    duration: 130,
    ...customizable("Typewriter", Typewriter, { text: "Make a launch video^ for vertical", cps: 20 }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "typewriter-follow",
    duration: 130,
    component: () => (
      <Center>
        <Typewriter text="Make a launch video^ for vertical" cps={20} follow={{ zoom: 2.5 }} />
      </Center>
    ),
  },
  {
    id: "word-rotator-slide",
    duration: 130,
    ...customizable(
      "WordRotator",
      WordRotator,
      { before: "Made for", words: ["creators", "startups", "agencies"], effect: "slide" },
      (element) => <Center>{element}</Center>,
    ),
  },
  ...highlightVariants.map(
    (variant): Demo => ({
      id: `highlight-${variant}`,
      duration: 75,
      ...customizable(
        "Highlight",
        Highlight,
        { text: "Render videos with plain React", highlight: "plain React", variant },
        (element) => <Center>{element}</Center>,
      ),
    }),
  ),
  {
    id: "counter-count",
    duration: 90,
    ...customizable(
      "Counter",
      Counter,
      { to: 48200, format: { style: "currency", currency: "USD" }, suffix: "/mo" },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "counter-rolling",
    duration: 90,
    component: () => (
      <Center>
        <Counter to={48200} format={{ style: "currency", currency: "USD" }} suffix="/mo" rolling />
      </Center>
    ),
  },
  {
    id: "scramble-decode",
    duration: 75,
    ...customizable("Scramble", Scramble, { text: "Access granted", font: "mono", seed: "login" }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "fit-title-fill",
    duration: 75,
    ...customizable("FitTitle", FitTitle, { text: "Season finale", effect: "mask" }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "blur-in-headline",
    duration: 75,
    ...customizable("BlurIn", BlurIn, { text: "Quietly, then all at once" }, (element) => <Center>{element}</Center>),
  },
  {
    id: "rise-up-headline",
    duration: 75,
    ...customizable("RiseUp", RiseUp, { text: "Every frame is code", accentWords: ["code"] }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "mask-reveal-headline",
    duration: 75,
    ...customizable("MaskReveal", MaskReveal, { text: "Made for vertical first" }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "char-rise-word",
    duration: 75,
    ...customizable("CharRise", CharRise, { text: "Launch day", size: 150 }, (element) => <Center>{element}</Center>),
  },
  {
    id: "line-slide-lines",
    duration: 90,
    ...customizable(
      "LineSlide",
      LineSlide,
      { text: "Write the script.\nRender the story.", align: "left" },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "drop-in-headline",
    duration: 75,
    ...customizable("DropIn", DropIn, { text: "Fresh drops every Friday" }, (element) => <Center>{element}</Center>),
  },
  {
    id: "pop-in-label",
    duration: 75,
    ...customizable("PopIn", PopIn, { text: "Now in beta", size: 130 }, (element) => <Center>{element}</Center>),
  },
  {
    id: "stamp-label",
    duration: 75,
    ...customizable("Stamp", Stamp, { text: "Sold out", size: 170 }, (element) => <Center>{element}</Center>),
  },
  {
    id: "stamp-settle",
    duration: 75,
    component: () => (
      <Center>
        <Stamp text="Sold out" size={170} motion="settle" />
      </Center>
    ),
  },
  {
    id: "word-push-hook",
    duration: 75,
    ...customizable("WordPush", WordPush, { words: ["Ship", "videos,", "not", "keyframes,", "faster"] }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "text-morph-phrase",
    duration: 90,
    ...customizable("TextMorph", TextMorph, { from: "Build faster", to: "Ship faster" }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "text-mask-video-window",
    duration: 90,
    component: () => (
      <Center>
        <TextMaskVideo text="MOTION" src={staticFile("reelcn-demo/clip.mp4")} />
      </Center>
    ),
  },
] satisfies Demo[];
