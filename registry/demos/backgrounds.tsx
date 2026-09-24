import type React from "react";
import { AbsoluteFill } from "remotion";
import { Aurora } from "../items/aurora";
import { Beams } from "../items/beams";
import { Bokeh } from "../items/bokeh";
import { BrandSolid } from "../items/brand-solid";
import { Center, Stage } from "../items/core";
import { Dots } from "../items/dots";
import { GradientMesh } from "../items/gradient-mesh";
import { Grain } from "../items/grain";
import { Grid } from "../items/grid";
import { Spotlight } from "../items/spotlight";
import { Starfield } from "../items/starfield";
import { TextReveal } from "../items/text-reveal";
import { customizable } from "./customizable";
import type { Demo } from "./index";

/** A background with a headline on top, to prove the text stays readable over it. */
function Scene({
  background,
  text,
  overlay,
}: {
  background: React.ReactNode;
  text: string;
  overlay?: React.ReactNode;
}) {
  return (
    <AbsoluteFill>
      {background}
      <Center>
        <TextReveal text={text} />
      </Center>
      {overlay}
    </AbsoluteFill>
  );
}

export default [
  {
    id: "brand-solid",
    duration: 90,
    bare: true,
    ...customizable("BrandSolid", BrandSolid, {}, (element) => (
      <Scene background={element} text="Made for your brand" />
    )),
  },
  {
    id: "gradient-mesh",
    duration: 120,
    bare: true,
    ...customizable("GradientMesh", GradientMesh, {}, (element) => (
      <Scene background={element} text="Color that moves" />
    )),
  },
  {
    id: "aurora",
    duration: 120,
    bare: true,
    ...customizable("Aurora", Aurora, {}, (element) => <Scene background={element} text="Quietly luminous" />),
  },
  {
    id: "spotlight-drift",
    duration: 120,
    bare: true,
    ...customizable("Spotlight", Spotlight, {}, (element) => <Scene background={element} text="All eyes here" />),
  },
  {
    id: "beams-corner",
    duration: 120,
    bare: true,
    ...customizable("Beams", Beams, {}, (element) => <Scene background={element} text="Now on stage" />),
  },
  {
    id: "beams-top",
    duration: 120,
    bare: true,
    component: () => <Scene background={<Beams origin="top" count={6} />} text="The big reveal" />,
  },
  {
    id: "grid-flat",
    duration: 120,
    bare: true,
    ...customizable("Grid", Grid, {}, (element) => <Scene background={element} text="Built on a grid" />),
  },
  {
    id: "grid-perspective",
    duration: 120,
    bare: true,
    component: () => <Scene background={<Grid perspective />} text="The road ahead" />,
  },
  {
    id: "dots-sweep",
    duration: 120,
    bare: true,
    ...customizable("Dots", Dots, {}, (element) => <Scene background={element} text="Every detail counts" />),
  },
  {
    id: "dots-ripple",
    duration: 120,
    bare: true,
    component: () => <Scene background={<Dots wave="ripple" />} text="Ripple effect" />,
  },
  {
    id: "grain",
    duration: 90,
    bare: true,
    ...customizable("Grain", Grain, { opacity: 0.12 }, (element) => (
      <Scene background={<Stage />} text="Shot on film" overlay={element} />
    )),
  },
  {
    id: "grain-mesh",
    duration: 90,
    bare: true,
    component: () => <Scene background={<GradientMesh />} text="Softer gradients" overlay={<Grain />} />,
  },
  {
    id: "starfield-across",
    duration: 120,
    bare: true,
    ...customizable("Starfield", Starfield, {}, (element) => <Scene background={element} text="Out of this world" />),
  },
  {
    id: "starfield-toward",
    duration: 120,
    bare: true,
    component: () => <Scene background={<Starfield travel="toward" />} text="Warp speed ahead" />,
  },
  {
    id: "bokeh",
    duration: 120,
    bare: true,
    ...customizable("Bokeh", Bokeh, {}, (element) => <Scene background={element} text="Evenings, in focus" />),
  },
] satisfies Demo[];
