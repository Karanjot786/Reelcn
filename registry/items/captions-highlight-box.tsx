/**
 * @title Captions: Highlight Box
 * @category social
 * @description A marker block travels word by word, like a highlighter following the speech.
 * @duration data-driven
 * @preset captions
 * @use Explainers and teaching clips where the key word should be unmissable
 * @tags captions, highlight, marker, explainer
 * @example
 * <CaptionsHighlightBox captions={captions} emphasize={["never"]} />
 */
import { Captions, type CaptionsProps } from "./captions";

export type CaptionsHighlightBoxProps = Omit<CaptionsProps, "variant">;

export function CaptionsHighlightBox(props: CaptionsHighlightBoxProps) {
  return <Captions {...props} variant="highlight-box" />;
}
