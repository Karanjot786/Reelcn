/**
 * @title Fonts
 * @category lib
 * @description Loads the curated font set used by the built-in themes, so renders look identical on every machine.
 */
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

const latin = { subsets: ["latin"] };

// ponytail: loads all five families up front. Split per theme if render start-up time ever matters.
loadInstrumentSerif("italic", { weights: ["400"], ...latin });

export const fonts = {
  inter: loadInter("normal", { weights: ["400", "500", "600", "700", "800"], ...latin }).fontFamily,
  instrumentSerif: loadInstrumentSerif("normal", { weights: ["400"], ...latin }).fontFamily,
  spaceGrotesk: loadSpaceGrotesk("normal", { weights: ["400", "500", "700"], ...latin }).fontFamily,
  jetbrainsMono: loadJetBrainsMono("normal", { weights: ["400", "500", "700"], ...latin }).fontFamily,
  bricolage: loadBricolage("normal", { weights: ["400", "600", "800"], ...latin }).fontFamily,
};
