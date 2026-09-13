/**
 * @title Captions: Word Stack
 * @category social
 * @description Words stacked one per line, with the spoken word growing and lifting.
 * @duration data-driven
 * @preset captions
 * @use Vertical video where a wide caption block would crowd the frame
 * @tags captions, vertical, stack, shorts
 * @example
 * <CaptionsWordStack captions={captions} maxWords={3} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsWordStackProps = Omit<CaptionsProps, "variant">;

export function CaptionsWordStack(props: CaptionsWordStackProps) {
  return <Captions {...props} variant="word-stack" />;
}
