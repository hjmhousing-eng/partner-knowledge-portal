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
      const target = event.target as Element;
      if (
        !target.closest("#ask-tab") &&
        !sidebarRef.current?.contains(target)
      ) {
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
      aria-label="Ask the library"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <header className="search-sidebar__head">
        <div>
          <p className="search-sidebar__kicker">Library assistant</p>
          <h2>Ask</h2>
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
          Continue asking
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
