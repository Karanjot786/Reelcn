"use client";
// biome-ignore-all lint/performance/noImgElement: static thumbnails with width/height

import Link from "next/link";
import { useState } from "react";
import { DemoPlayer } from "./demo-player";

type Frame = { id: string; name: string; category: string; href: string };

/** The catalog as a contact sheet: stills at rest; hovering or focusing a frame plays that item. One frame carries the keeper mark. */
export function FrameSheet({ frames }: { frames: Frame[] }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="sheet">
      {frames.map((frame, i) => (
        <Link
          key={frame.id}
          className="cell"
          href={frame.href}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive((a) => (a === i ? null : a))}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
        >
          <div className="scr">
            <img
              src={`/thumbs/${frame.id}.jpg`}
              alt={`${frame.name} preview`}
              width={480}
              height={270}
              loading="lazy"
            />
            {active === i && (
              <div className="cell-player">
                <DemoPlayer
                  demoId={frame.id}
                  category={frame.category}
                  format="16x9"
                  theme="midnight"
                  controls={false}
                />
              </div>
            )}
          </div>
          <div className="cap">
            <span>{frame.name}</span>
            <b>{frame.category}</b>
          </div>
          {i === 5 && (
            <>
              <svg
                className="keeper reveal-on-view"
                viewBox="0 0 200 130"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M24 68 C 12 18, 184 4, 190 54 C 196 108, 40 128, 16 84 C 8 68, 34 38, 78 28"
                  fill="none"
                  stroke="#F0484E"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span className="keeper-note">keeper</span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
