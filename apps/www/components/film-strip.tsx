// biome-ignore-all lint/performance/noImgElement: static thumbnails with width/height; next/image adds nothing here
import type { CSSProperties } from "react";
import { GreaseCircle } from "./grease";

export type Frame = { src?: string; edge?: string };

/**
 * A strip of film: sprocket rows, frames, optional edge-print numbers, and an optional grease circle and note on one frame.
 * Decorative, so the strip is hidden from assistive tech and every image has alt="". A frame with no `src` is blank leader.
 * Styles live in app/landing.css (`.film*`).
 */
export function FilmStrip({
  frames,
  portrait = false,
  crawl = false,
  mark,
  note,
  from = 0,
  className = "",
}: {
  frames: Frame[];
  /** 9:16 frames instead of 16:9. */
  portrait?: boolean;
  /** Loop the frames sideways. They render twice, so the loop is seamless. */
  crawl?: boolean;
  /** Index of the frame circled in grease pencil. */
  mark?: number;
  /** Grease note under the marked frame. */
  note?: string;
  /** Develop-order offset, so a second strip continues the first strip's stagger. */
  from?: number;
  className?: string;
}) {
  const cells = crawl ? [...frames, ...frames] : frames;
  const classes = ["film", portrait && "film-portrait", crawl && "film-crawl", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={{ "--n": frames.length } as CSSProperties} aria-hidden>
      <div className="film-track">
        {cells.map((frame, i) => {
          const k = i % frames.length;
          return (
            <div key={i} className="film-cell" style={{ "--i": from + k } as CSSProperties}>
              <div className="film-frame">
                {frame.src && <img src={frame.src} alt="" width={portrait ? 270 : 480} height={portrait ? 480 : 270} />}
                {k === mark && <GreaseCircle className="film-mark" />}
                {k === mark && note && <span className="film-note">{note}</span>}
              </div>
              {frame.edge && <span className="film-edge">{frame.edge}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
