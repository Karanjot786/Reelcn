"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { SidebarItem, useFolderDepth } from "fumadocs-ui/components/sidebar/base";
import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";

// Fumadocs' docs-layout item look (fumadocs-ui/dist/layouts/docs/slots/sidebar.js), which that package does not export.
const ITEM =
  "relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors";
const NESTED =
  "data-[active=true]:before:content-[''] data-[active=true]:before:bg-fd-primary data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:inset-s-2.5";
const SECTIONS: [id: string, title: string][] = [
  ["preview", "Preview"],
  ["installation", "Installation"],
  ["props", "Props"],
  ["scenes", "Scenes"],
];

/** A sidebar link in Fumadocs' style; the open template also lists its page sections, as in the mockup. */
export function DocsSidebarItem({ item }: { item: PageTree.Item }) {
  const depth = useFolderDepth();
  const pathname = usePathname();
  // Top-level component links are the templates; the Components group keeps its items inside folders.
  const isOpenTemplate = depth === 0 && item.url.startsWith("/docs/components/") && pathname === item.url;
  return (
    <>
      <SidebarItem
        href={item.url}
        external={item.external}
        icon={item.icon}
        active={pathname === item.url}
        className={depth >= 1 ? `${ITEM} ${NESTED}` : ITEM}
        style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
      >
        {item.name}
      </SidebarItem>
      {isOpenTemplate && <SectionList />}
    </>
  );
}

/** The page's sections under the open template, with an amber dot on the one in view. */
function SectionList() {
  const [present, setPresent] = useState<[string, string][]>([]);
  const [active, setActive] = useState(0);
  const [y, setY] = useState(14);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    // ponytail: Scenes renders once the demo chunk loads; scan again after a beat instead of watching the DOM.
    const scan = () => {
      observer?.disconnect();
      const found = SECTIONS.filter(([id]) => document.getElementById(id));
      setPresent(found);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(found.findIndex(([id]) => id === entry.target.id));
          }
        },
        { rootMargin: "0px 0px -70% 0px" },
      );
      for (const [id] of found) {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      }
    };
    scan();
    const timer = window.setTimeout(scan, 1200);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `present` changes which links exist, so the dot re-measures
  useEffect(() => {
    const link = links.current[active];
    if (link) setY(link.offsetTop + link.offsetHeight / 2 - 3);
  }, [active, present]);

  if (present.length === 0) return null;
  return (
    <ul className="sub">
      <li className="dot" aria-hidden="true" style={{ "--y": `${y}px` } as CSSProperties} />
      {present.map(([id, title], i) => (
        <li key={id}>
          <a
            ref={(link) => {
              links.current[i] = link;
            }}
            href={`#${id}`}
            aria-current={i === active ? "true" : undefined}
          >
            {title}
          </a>
        </li>
      ))}
    </ul>
  );
}
