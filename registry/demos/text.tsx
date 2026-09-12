import { Center } from "../items/core";
import { TextReveal, type TextRevealEffect } from "../items/text-reveal";
import type { Demo } from "./index";

const effects: TextRevealEffect[] = ["rise", "blur", "fade", "scale", "drop", "mask"];

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
        <TextReveal text="Héllo, wörld" split="char" size={130} />
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
] satisfies Demo[];
