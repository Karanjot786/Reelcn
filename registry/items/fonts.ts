/**
 * @title Fonts
 * @category lib
 * @description Loads the curated font set used by the built-in themes, so renders look identical on every machine.
 * @example
 * import { fonts } from "./fonts";
 *
 * const heading = `${fonts.instrumentSerif}, ui-serif, Georgia, serif`;
 */

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadAtkinsonHyperlegible } from "@remotion/google-fonts/AtkinsonHyperlegible";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadCormorantGaramond } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexSansCondensed } from "@remotion/google-fonts/IBMPlexSansCondensed";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
import { loadFont as loadSchibstedGrotesk } from "@remotion/google-fonts/SchibstedGrotesk";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { continueRender, delayRender } from "remotion";

const latin = { subsets: ["latin" as const] };

/** Calls `load` once per process and caches the resulting `fontFamily` string; every later call is free. */
function lazy(load: () => { fontFamily: string }): () => string {
  let value: string | undefined;
  return () => (value ??= load().fontFamily);
}

// The mono/Signal theme's signature move is animating Archivo's `wdth` axis between 62 and 125
// (registry/items/core-math.ts's useVariableFontAxis). @remotion/google-fonts' Archivo module ships
// only static weight instances at the font's default width — no variable-font file — so this theme's
// heading font is loaded directly with the browser FontFace API instead, the same mechanism
// @remotion/google-fonts uses internally, gated by delayRender/continueRender like every other font
// here. URL pinned from https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900's
// latin subset (curl'd with a desktop Chrome UA so it returns woff2); re-pin if Google rotates it.
const ARCHIVO_VARIABLE_URL = "https://fonts.gstatic.com/s/archivo/v25/k3kQo8UDI-1M0wlSfdnoLg.woff2";
const ARCHIVO_VARIABLE_FAMILY = "Archivo Variable";

function loadArchivoVariable(): string {
  if (typeof document === "undefined" || typeof FontFace === "undefined") return ARCHIVO_VARIABLE_FAMILY;
  // Loaded eagerly (not just in the .catch below) so its fontFamily can be listed as a CSS fallback
  // in the string this function returns synchronously — by the time FontFace.load() might reject,
  // that string has already been handed out as `theme.fonts.heading`, so there's no way to swap it
  // for the static family after the fact. loaders.archivo() is defined below; hoisting is fine since
  // this function only runs once lazily invoked, by which point the module has finished evaluating.
  const staticFamily = loaders.archivo();
  const handle = delayRender("Archivo Variable font");
  const face = new FontFace(ARCHIVO_VARIABLE_FAMILY, `url(${ARCHIVO_VARIABLE_URL})`, {
    weight: "100 900",
    stretch: "62% 125%",
  });
  face
    .load()
    .then((loaded) => {
      (document.fonts as FontFaceSet & { add(font: FontFace): void }).add(loaded);
      continueRender(handle);
    })
    .catch((err) => {
      // Fallback: static Archivo at its default width still renders correctly, just without the
      // wdth move (spec §13 risk 1). Since "Archivo Variable" is never registered with
      // document.fonts on this path, the browser's CSS font-family fallback in the string returned
      // below skips straight to the already-loaded static Archivo family.
      console.warn(
        `Archivo Variable failed to load from the pinned woff2, falling back to static Archivo: ${(err as Error).message}`,
      );
      continueRender(handle);
    });
  return `${ARCHIVO_VARIABLE_FAMILY}, ${staticFamily}`;
}

const loaders = {
  inter: lazy(() => loadInter("normal", { weights: ["400", "500", "600", "700", "800"], ...latin })),
  instrumentSerif: lazy(() => {
    // Instrument Serif's italic face is only ever paired with its normal face, never used alone.
    loadInstrumentSerif("italic", { weights: ["400"], ...latin });
    return loadInstrumentSerif("normal", { weights: ["400"], ...latin });
  }),
  spaceGrotesk: lazy(() => loadSpaceGrotesk("normal", { weights: ["400", "500", "700"], ...latin })),
  jetbrainsMono: lazy(() => loadJetBrainsMono("normal", { weights: ["400", "500", "700"], ...latin })),
  bricolage: lazy(() => loadBricolage("normal", { weights: ["400", "600", "800"], ...latin })),
  schibstedGrotesk: lazy(() => loadSchibstedGrotesk("normal", { weights: ["400", "700"], ...latin })),
  ibmPlexSans: lazy(() => loadIBMPlexSans("normal", { weights: ["400", "500"], ...latin })),
  ibmPlexSansCondensed: lazy(() => loadIBMPlexSansCondensed("normal", { weights: ["600"], ...latin })),
  ibmPlexMono: lazy(() => loadIBMPlexMono("normal", { weights: ["400", "500"], ...latin })),
  atkinsonHyperlegible: lazy(() => loadAtkinsonHyperlegible("normal", { weights: ["400", "700"], ...latin })),
  cormorantGaramond: lazy(() => loadCormorantGaramond("normal", { weights: ["500"], ...latin })),
  manrope: lazy(() => loadManrope("normal", { weights: ["400", "600"], ...latin })),
  anton: lazy(() => loadAnton("normal", { weights: ["400"], ...latin })),
  rubik: lazy(() => loadRubik("normal", { weights: ["500", "800"], ...latin })),
  archivo: lazy(() => loadArchivo("normal", { weights: ["400", "600", "800"], ...latin })),
  archivoVariable: lazy(() => ({ fontFamily: loadArchivoVariable() })),
};

/** Each family's `fontFamily` string, loaded the first time it's read (`fonts.inter`, not `fonts.inter()`). */
export const fonts: Record<keyof typeof loaders, string> = {
  get inter() {
    return loaders.inter();
  },
  get instrumentSerif() {
    return loaders.instrumentSerif();
  },
  get spaceGrotesk() {
    return loaders.spaceGrotesk();
  },
  get jetbrainsMono() {
    return loaders.jetbrainsMono();
  },
  get bricolage() {
    return loaders.bricolage();
  },
  get schibstedGrotesk() {
    return loaders.schibstedGrotesk();
  },
  get ibmPlexSans() {
    return loaders.ibmPlexSans();
  },
  get ibmPlexSansCondensed() {
    return loaders.ibmPlexSansCondensed();
  },
  get ibmPlexMono() {
    return loaders.ibmPlexMono();
  },
  get atkinsonHyperlegible() {
    return loaders.atkinsonHyperlegible();
  },
  get cormorantGaramond() {
    return loaders.cormorantGaramond();
  },
  get manrope() {
    return loaders.manrope();
  },
  get anton() {
    return loaders.anton();
  },
  get rubik() {
    return loaders.rubik();
  },
  get archivo() {
    return loaders.archivo();
  },
  get archivoVariable() {
    return loaders.archivoVariable();
  },
};
