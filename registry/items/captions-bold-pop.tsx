/**
 * @title Captions: Bold Pop
 * @category social
 * @description Heavy centered captions where the spoken word grows and lifts.
 * @duration data-driven
 * @preset captions
 * @use Shorts and reels that need captions to carry the edit
 * @tags captions, shorts, bold
 * @example
 * <CaptionsBoldPop captions={captions} emphasize={["free"]} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsBoldPopProps = Omit<CaptionsProps, "variant">;

export function CaptionsBoldPop(props: CaptionsBoldPopProps) {
  return <Captions {...props} variant="bold-pop" />;
}
