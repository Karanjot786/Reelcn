/**
 * @title Use Beat
 * @category audio
 * @description A pulse that follows a fixed tempo, with no audio analysis: pure math, so it renders identically every time.
 * @duration sustained
 * @use Cutting, popping or shaking anything in time with a music bed
 * @use Beat-synced motion when you know the track's BPM
 * @avoid Reacting to a voice or an unknown track — use `audio-reactive`
 * @tags beat, bpm, rhythm, sync, hook
 * @example
 * const { pulse, beat } = useBeat({ bpm: 120 });
 *
 * <div style={{ scale: String(1 + pulse * 0.2) }}>{beat}</div>
 */
import { useCurrentFrame, useVideoConfig } from "remotion";

export type UseBeatOptions = {
  /** Tempo of the track. */
  bpm: number;
  /** Seconds to shift the grid by, when the track does not start on a beat. */
  offset?: number;
  /** Seconds a pulse takes to fall back to zero. */
  decay?: number;
  /** 1 = every beat, 2 = every eighth, 4 = every sixteenth. */
  subdivision?: number;
};

export type Beat = {
  /** 1 on the beat, falling to 0 over `decay` seconds. */
  pulse: number;
  /** Beat index since the start; negative before `offset`. */
  beat: number;
  /** Seconds since the last beat. */
  sinceBeat: number;
  /** Seconds between beats. */
  beatLength: number;
};

export function useBeat({ bpm, offset = 0, decay = 0.35, subdivision = 1 }: UseBeatOptions): Beat {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps - offset;
  const beatLength = 60 / (bpm * subdivision);
  const beat = Math.floor(seconds / beatLength);
  const sinceBeat = seconds - beat * beatLength;
  // Sharp attack, eased tail: a struck drum, not a sine.
  const raw = seconds < 0 ? 0 : Math.max(0, 1 - sinceBeat / decay);
  return { pulse: raw * raw, beat, sinceBeat, beatLength };
}
