"use client";

import { useSearch } from "./SearchContext";

export function SearchBar() {
  const { input, setInput, submit, busy, headerRef, pageContext } = useSearch();

  return (
    <form
      className="header-search"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor="header-search">
        Ask the library
      </label>
      <input
        id="header-search"
        ref={headerRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={busy}
        placeholder={
          pageContext ? `Ask about ${pageContext.title}` : "Ask the library"
        }
        autoComplete="off"
      />
      <button type="submit" disabled={busy}>
        Ask
      </button>
    </form>
  );
}
