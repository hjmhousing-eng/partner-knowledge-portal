"use client";

import { useSearch } from "./SearchContext";

export function SearchToggle() {
  const { open, toggle } = useSearch();

  return (
    <button
      id="ask-tab"
      type="button"
      className="ask-tab"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="search-sidebar"
      aria-label={open ? "Close Ask panel" : "Open Ask panel"}
    >
      <span>Ask</span>
      <span aria-hidden>{open ? "›" : "‹"}</span>
    </button>
  );
}
