/**
 * @title Fonts
 * @category lib
 * @description Loads the curated font set used by the built-in themes, so renders look identical on every machine.
 * @example
 * import { fonts } from "./fonts";
 *
 * const heading = `${fonts.instrumentSerif}, ui-serif, Georgia, serif`;
 */
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

const latin = { subsets: ["latin" as const] };

/** Calls `load` once per process and caches the resulting `fontFamily` string; every later call is free. */
function lazy(load: () => { fontFamily: string }): () => string {
  let value: string | undefined;
  return () => (value ??= load().fontFamily);
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
};
