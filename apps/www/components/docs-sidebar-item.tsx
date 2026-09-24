"use client";

import { SidebarItem, useFolderDepth } from "fumadocs-ui/components/sidebar/base";
import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { PreviewItem } from "@/lib/tree";

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
export function DocsSidebarItem({ item }: { item: PreviewItem }) {
  const depth = useFolderDepth();
  const pathname = usePathname();
  // Top-level component links are the templates; the Components group keeps its items inside folders.
  const isOpenTemplate = depth === 0 && item.url.startsWith("/docs/components/") && pathname === item.url;
  const preview = item.preview;
  return (
    <>
      <SidebarItem
        href={item.url}
        external={item.external}
        icon={item.icon}
        active={pathname === item.url}
        className={depth >= 1 ? `${ITEM} ${NESTED}` : ITEM}
        style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
        onPointerEnter={
          preview
            ? (event) => event.pointerType === "mouse" && showPreview(preview, event.currentTarget as HTMLElement)
            : undefined
        }
        onPointerLeave={preview ? () => hidePreview() : undefined}
        onClick={preview ? () => hidePreview(true) : undefined}
      >
        {item.name}
      </SidebarItem>
      {isOpenTemplate && <SectionList />}
    </>
  );
}

// One shared hover card for the whole sidebar, so moving between links retargets it instead of closing and
// reopening it (tooltip rule: the first open waits, later ones are instant).
type PreviewState = { preview: NonNullable<PreviewItem["preview"]>; y: number; x: number } | null;
let previewState: PreviewState = null;
const listeners = new Set<() => void>();
let openTimer = 0;
let closeTimer = 0;
const setPreviewState = (next: PreviewState) => {
  previewState = next;
  for (const listener of listeners) listener();
};

const CARD_W = 440;
const CARD_H = 300; // 16:9 frame plus the caption row

function showPreview(preview: NonNullable<PreviewItem["preview"]>, target: HTMLElement) {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  const rect = target.getBoundingClientRect();
  const next = {
    preview,
    x: rect.right + 16,
    y: Math.min(Math.max(rect.top + rect.height / 2 - CARD_H / 2, 12), window.innerHeight - CARD_H - 12),
  };
  if (previewState) setPreviewState(next);
  else openTimer = window.setTimeout(() => setPreviewState(next), 80);
}

function hidePreview(now?: boolean) {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  if (now === true) setPreviewState(null);
  else closeTimer = window.setTimeout(() => setPreviewState(null), 120);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Mount once (the docs layout does): renders the shared live-preview card beside the hovered sidebar link. */
export function SidebarPreviewHost() {
  const state = useSyncExternalStore(
    subscribe,
    () => previewState,
    () => null,
  );
  if (!state) return null;
  const { preview } = state;
  return createPortal(
    <div
      className="sidebar-preview"
      aria-hidden="true"
      style={{ left: state.x, width: CARD_W, transform: `translateY(${state.y}px)` }}
    >
      <div className="sidebar-preview-frame">
        <PreviewVideo demoId={preview.demoId} />
      </div>
      <div className="sidebar-preview-caption">
        <b>{preview.title}</b>
        <span>{preview.category}</span>
      </div>
    </div>,
    document.body,
  );
}

/**
 * A pre-rendered clip (scripts/previews.ts): it starts at once, where a live Player takes a beat to mount.
 * One element for the card's whole life, with only `src` swapped per hover: a fresh `<video>` per demo left
 * decoders and buffers alive until GC, and a dozen quick hovers slowed the whole browser down.
 */
function PreviewVideo({ demoId }: { demoId: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.removeAttribute("data-ready");
    video.removeAttribute("poster");
    video.src = `/previews/${demoId}.webm`;
    video.play().catch(() => {});
  }, [demoId]);
  // Free the decoder when the card closes, instead of waiting for GC.
  useEffect(
    () => () => {
      const video = ref.current;
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    },
    [],
  );
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      onLoadedData={(event) => event.currentTarget.setAttribute("data-ready", "")}
      // No clip yet (a new demo before `pnpm previews` ran): fall back to the committed still.
      onError={(event) => {
        if (!event.currentTarget.getAttribute("src")) return;
        event.currentTarget.poster = `/thumbs/${demoId}.jpg`;
        event.currentTarget.setAttribute("data-ready", "");
      }}
    />
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
