"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoPlayer } from "./demo-player";

/**
 * A contact-sheet tile: a still by default, swapped for a live (silent, uncontrolled) Player on
 * hover or keyboard focus. `demoId` is omitted for lib items, which show a text frame instead.
 */
export function CatalogTile({
  name,
  title,
  category,
  demoId,
}: {
  name: string;
  title: string;
  category: string;
  demoId?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <Link
      href={`/docs/components/${name}`}
      className="catalog-tile"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span className="catalog-frame">
        {demoId ? (
          active ? (
            <DemoPlayer demoId={demoId} category={category} format="16x9" theme="midnight" controls={false} />
          ) : (
            // Decorative: the title text right below already names the component.
            <img src={`/thumbs/${demoId}.jpg`} loading="lazy" alt="" width={480} height={270} />
          )
        ) : (
          <span className="catalog-lib">{name}</span>
        )}
      </span>
      <span className="catalog-title">{title}</span>
    </Link>
  );
}
