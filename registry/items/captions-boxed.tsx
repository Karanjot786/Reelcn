/**
 * @title Captions: Boxed
 * @category social
 * @description Each word in its own rounded chip, with the spoken chip filled in the accent color.
 * @duration data-driven
 * @preset captions
 * @use Busy footage where plain text would get lost
 * @tags captions, chips, contrast
 * @example
 * <CaptionsBoxed captions={captions} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsBoxedProps = Omit<CaptionsProps, "variant">;

export function CaptionsBoxed(props: CaptionsBoxedProps) {
  return <Captions {...props} variant="boxed" />;
}
