"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";

/** A search box that opens the same Fumadocs dialog as ⌘K: the landing nav's, and the docs sidebar's. */
export function SearchButton({
  className = "searchbtn",
  label = "Search components",
}: {
  className?: string;
  label?: string;
}) {
  const { setOpenSearch } = useSearchContext();
  return (
    <button className={className} type="button" onClick={() => setOpenSearch(true)}>
      <span>{label}</span>
      <span className="kbd">⌘K</span>
    </button>
  );
}
