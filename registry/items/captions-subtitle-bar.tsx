/**
 * @title Captions: Subtitle Bar
 * @category social
 * @description Broadcast-style subtitles on a translucent bar, readable over anything.
 * @duration data-driven
 * @preset captions
 * @use Long-form video, webinars and anything with a wide audience
 * @tags captions, subtitles, broadcast, accessibility
 * @example
 * <CaptionsSubtitleBar captions={captions} position="bottom" />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsSubtitleBarProps = Omit<CaptionsProps, "variant">;

export function CaptionsSubtitleBar(props: CaptionsSubtitleBarProps) {
  return <Captions {...props} variant="subtitle-bar" />;
}
