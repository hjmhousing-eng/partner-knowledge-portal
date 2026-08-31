"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function linkify(text: string) {
  const parts = text.split(/(\/products\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("/products/")) {
      const href = part.replace(/[.,;:!?)]+$/, "");
      const trailing = part.slice(href.length);
      return (
        <span key={index}>
          <Link href={href}>{href}</Link>
          {trailing}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function AskWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(pathname === "/ask");
  const [input, setInput] = useState("");
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  });

  const busy = status === "submitted" || status === "streaming";

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  return (
    <div className="ask-dock">
      <div
        className={`ask-panel${open ? " is-open" : ""}`}
        id={panelId}
        hidden={!open}
        role="dialog"
        aria-label="Search the library"
      >
        <header className="ask-panel__head">
          <div>
            <p className="ask-panel__kicker">Library search</p>
            <h2>Search</h2>
          </div>
          <button type="button" className="ask-panel__close" onClick={toggle}>
            Close
          </button>
        </header>
        <p className="ask-panel__hint">
          Answers only include documents you can open.
        </p>
        <div className="ask-log" ref={logRef}>
          {messages.length === 0 ? (
            <p className="ask-empty">
              Try a product name, spec, or program question.
            </p>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ask-bubble ask-bubble--${message.role}`}
            >
              <span className="ask-bubble__who">
                {message.role === "user" ? "You" : "Library"}
              </span>
              {message.parts.map((part, index) => {
                if (part.type !== "text") {
                  return null;
                }
                return (
                  <p key={`${message.id}-${index}`}>{linkify(part.text)}</p>
                );
              })}
            </div>
          ))}
          {busy ? <p className="ask-typing">Searching…</p> : null}
          {error ? (
            <p className="ask-error">
              Search is unavailable right now. Try again in a moment.
            </p>
          ) : null}
        </div>
        <form
          className="ask-form"
          onSubmit={(event) => {
            event.preventDefault();
            const text = input.trim();
            if (!text || busy) {
              return;
            }
            setInput("");
            void sendMessage({ text });
          }}
        >
          <label className="sr-only" htmlFor="ask-input">
            Question
          </label>
          <input
            id="ask-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={busy}
            placeholder="Search the library"
            autoComplete="off"
          />
          <button type="submit" disabled={busy}>
            Send
          </button>
        </form>
      </div>
      <button
        type="button"
        className={`ask-fab${open ? " is-open" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="ask-fab__label">{open ? "Close" : "Search"}</span>
        <kbd>Ctrl K</kbd>
      </button>
    </div>
  );
}
