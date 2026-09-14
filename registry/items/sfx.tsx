/**
 * @title SFX
 * @category lib
 * @description Thirty CC0 sound effects, played from one component. Streams from www.reelcn.dev, or from your own public folder after `reelcn-sfx-pull`.
 * @example
 * <Sequence from={30}>
 *   <Sfx name="whoosh" />
 * </Sequence>
 */
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export const SFX_NAMES = [
  "bell",
  "bubble",
  "camera-shutter",
  "chime",
  "click",
  "click-soft",
  "coin",
  "ding",
  "drop",
  "error",
  "glitch",
  "impact",
  "keypress",
  "notification",
  "pop",
  "pop-high",
  "rise",
  "riser-short",
  "sparkle",
  "success",
  "swipe",
  "swish",
  "swoosh",
  "tap",
  "thud",
  "tick",
  "transition-hit",
  "typing",
  "whoosh",
  "whoosh-soft",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

/** `reelcn-sfx-pull` sets this to true after copying the sounds into your public folder. */
export const SFX_LOCAL: boolean = false;

const SFX_BASE = "https://www.reelcn.dev/sfx";

/**
 * URL of one sound: hosted by default, local once pulled. `occurrence` (0-indexed) picks the base file
 * on even calls and the `-alt` file on odd ones, so a sound repeated across a story alternates between
 * its two build-time variants (rule S2) instead of playing the identical file every time.
 */
export function sfxSrc(name: SfxName, occurrence = 0): string {
  const file = occurrence % 2 === 0 ? name : `${name}-alt`;
  return SFX_LOCAL ? staticFile(`reelcn/sfx/${file}.mp3`) : `${SFX_BASE}/${file}.mp3`;
}

export type SfxProps = {
  name: SfxName;
  /** 0 to 1. */
  volume?: number;
  /** Which occurrence of this sound this is in the current sequence (0-indexed). Alternates the build's two variants; defaults to 0 (always the base file) so existing call sites are unaffected. */
  occurrence?: number;
};

/** Plays one sound at the start of the Sequence it sits in. */
export function Sfx({ name, volume = 1, occurrence = 0 }: SfxProps) {
  return <Audio src={sfxSrc(name, occurrence)} volume={volume} />;
}
