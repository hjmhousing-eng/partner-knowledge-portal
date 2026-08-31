"use client";

import { useSearch } from "./SearchContext";

export function SearchToggle() {
  const { open, toggle } = useSearch();

  return (
    <button
      type="button"
      className="search-toggle"
      onClick={toggle}
      hidden={open}
      aria-expanded={open}
      aria-controls="search-sidebar"
    >
      Show search
    </button>
  );
}
