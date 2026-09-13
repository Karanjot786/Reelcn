/**
 * @title Captions: Minimal
 * @category social
 * @description Quiet captions: one line, no effects, with only the spoken word brightening.
 * @duration data-driven
 * @preset captions
 * @use Interviews and documentary footage where captions should stay out of the way
 * @tags captions, minimal, interview
 * @example
 * <CaptionsMinimal captions={captions} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsMinimalProps = Omit<CaptionsProps, "variant">;

export function CaptionsMinimal(props: CaptionsMinimalProps) {
  return <Captions {...props} variant="minimal" />;
}
