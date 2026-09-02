"use client";

import { useEffect, useRef } from "react";
import { SearchTranscript } from "./SearchTranscript";
import { useSearch } from "./SearchContext";

export function SearchSidebar() {
  const { open, setOpen, input, setInput, submit, busy } = useSearch();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function collapseOnOutsideClick(event: PointerEvent) {
      if (!sidebarRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", collapseOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", collapseOnOutsideClick);
  }, [open, setOpen]);

  return (
    <aside
      ref={sidebarRef}
      id="search-sidebar"
      className={`search-sidebar${open ? " is-open" : ""}`}
      aria-label="Library search"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <header className="search-sidebar__head">
        <div>
          <p className="search-sidebar__kicker">Library search</p>
          <h2>Search</h2>
        </div>
        <button type="button" onClick={() => setOpen(false)}>
          Hide
        </button>
      </header>
      <SearchTranscript />
      <form
        className="ask-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor="sidebar-search">
          Continue the search
        </label>
        <input
          id="sidebar-search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
          placeholder="Ask a follow-up"
          autoComplete="off"
        />
        <button type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </aside>
  );
}
