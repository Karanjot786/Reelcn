/**
 * @title Captions: Karaoke
 * @category social
 * @description Captions that fill in word by word as they are spoken, and dim the words still to come.
 * @duration data-driven
 * @preset captions
 * @use Lyric videos and sing-along clips
 * @use Tutorials where viewers follow along word by word
 * @tags captions, karaoke, lyrics
 * @example
 * <CaptionsKaraoke captions={captions} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsKaraokeProps = Omit<CaptionsProps, "variant">;

export function CaptionsKaraoke(props: CaptionsKaraokeProps) {
  return <Captions {...props} variant="karaoke" />;
}
