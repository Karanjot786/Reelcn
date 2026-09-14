import { BlurIn } from "../items/blur-in";
import { CharRise } from "../items/char-rise";
import { Center } from "../items/core";
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
import { TextReveal, type TextRevealEffect } from "../items/text-reveal";
import { Typewriter } from "../items/typewriter";
import { WordPush } from "../items/word-push";
import { WordRotator } from "../items/word-rotator";
import type { Demo } from "./index";

const effects: TextRevealEffect[] = ["rise", "blur", "fade", "scale", "drop", "mask"];

const highlightVariants: HighlightVariant[] = ["marker", "underline", "box", "circle"];

export default [
  ...effects.map(
    (effect): Demo => ({
      id: `text-reveal-${effect}`,
      duration: 75,
      component: () => (
        <Center>
          <TextReveal text="Ship videos, not keyframes" effect={effect} accentWords={["videos"]} />
        </Center>
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
    id: "typewriter-type",
    duration: 130,
    component: () => (
      <Center>
        <Typewriter text="Make a launch video^ for vertical" cps={20} />
      </Center>
    ),
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
    component: () => (
      <Center>
        <WordRotator before="Made for" words={["creators", "startups", "agencies"]} effect="slide" />
      </Center>
    ),
  },
  ...highlightVariants.map(
    (variant): Demo => ({
      id: `highlight-${variant}`,
      duration: 75,
      component: () => (
        <Center>
          <Highlight text="Render videos with plain React" highlight="plain React" variant={variant} />
        </Center>
      ),
    }),
  ),
  {
    id: "counter-count",
    duration: 90,
    component: () => (
      <Center>
        <Counter to={48200} format={{ style: "currency", currency: "USD" }} suffix="/mo" />
      </Center>
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
    component: () => (
      <Center>
        <Scramble text="Access granted" font="mono" seed="login" />
      </Center>
    ),
  },
  {
    id: "fit-title-fill",
    duration: 75,
    component: () => (
      <Center>
        <FitTitle text="Season finale" effect="mask" />
      </Center>
    ),
  },
  {
    id: "blur-in-headline",
    duration: 75,
    component: () => (
      <Center>
        <BlurIn text="Quietly, then all at once" />
      </Center>
    ),
  },
  {
    id: "rise-up-headline",
    duration: 75,
    component: () => (
      <Center>
        <RiseUp text="Every frame is code" accentWords={["code"]} />
      </Center>
    ),
  },
  {
    id: "mask-reveal-headline",
    duration: 75,
    component: () => (
      <Center>
        <MaskReveal text="Made for vertical first" />
      </Center>
    ),
  },
  {
    id: "char-rise-word",
    duration: 75,
    component: () => (
      <Center>
        <CharRise text="Launch day" size={150} />
      </Center>
    ),
  },
  {
    id: "line-slide-lines",
    duration: 90,
    component: () => (
      <Center>
        <LineSlide text={"Write the script.\nRender the story."} align="left" />
      </Center>
    ),
  },
  {
    id: "drop-in-headline",
    duration: 75,
    component: () => (
      <Center>
        <DropIn text="Fresh drops every Friday" />
      </Center>
    ),
  },
  {
    id: "pop-in-label",
    duration: 75,
    component: () => (
      <Center>
        <PopIn text="Now in beta" size={130} />
      </Center>
    ),
  },
  {
    id: "stamp-label",
    duration: 75,
    component: () => (
      <Center>
        <Stamp text="Sold out" size={170} />
      </Center>
    ),
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
    component: () => (
      <Center>
        <WordPush words={["Ship", "videos,", "not", "keyframes,", "faster"]} />
      </Center>
    ),
  },
] satisfies Demo[];
