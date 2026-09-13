/**
 * @title Captions: Neon
 * @category social
 * @description Captions where the spoken word glows in the accent color.
 * @duration data-driven
 * @preset captions
 * @use Night-time and club footage, music clips
 * @avoid Corporate or documentary footage — use `captions-minimal`
 * @tags captions, neon, glow, music
 * @example
 * <CaptionsNeon captions={captions} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsNeonProps = Omit<CaptionsProps, "variant">;

export function CaptionsNeon(props: CaptionsNeonProps) {
  return <Captions {...props} variant="neon" />;
}
