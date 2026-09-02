"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearch } from "./SearchContext";

function toolStepLabel(part: {
  type: string;
  toolName?: string;
  state?: string;
  output?: unknown;
}): string | null {
  const name =
    part.toolName ??
    (part.type.startsWith("tool-") ? part.type.slice("tool-".length) : "");
  const pending =
    part.state === "input-streaming" || part.state === "input-available";

  if (name === "search_library") {
    if (pending) {
      return "Searching the library…";
    }
    const hits = Array.isArray(part.output) ? part.output.length : 0;
    return hits === 1 ? "Found 1 article" : `Found ${hits} articles`;
  }
  if (name === "ask_box_ai") {
    return pending
      ? "Reviewing the matching articles…"
      : "Relevant details found";
  }
  if (name === "read_sources") {
    return pending ? "Reading article text…" : "Loaded article text";
  }
  if (part.type === "reasoning") {
    return "Working…";
  }
  return null;
}

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

export function SearchTranscript() {
  const { messages, busy, error } = useSearch();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  return (
    <div className="ask-log" ref={logRef}>
      {messages.length === 0 ? (
        <p className="ask-empty">
          Ask a product, spec, or program question. Answers only include
          documents you can open.
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
            if (part.type === "text" && "text" in part && part.text) {
              return (
                <p key={`${message.id}-${index}`}>{linkify(part.text)}</p>
              );
            }
            const step = toolStepLabel(part);
            if (!step) {
              return null;
            }
            const pending =
              "state" in part &&
              (part.state === "input-streaming" ||
                part.state === "input-available");
            return (
              <p
                key={`${message.id}-${index}`}
                className={`ask-step${pending ? " is-pending" : ""}`}
              >
                {step}
              </p>
            );
          })}
        </div>
      ))}
      {busy &&
      !messages.some((message) =>
        message.parts.some((part) => toolStepLabel(part)),
      ) ? (
        <p className="ask-typing">Working…</p>
      ) : null}
      {error ? (
        <p className="ask-error">
          Search is rate-limited right now. Wait a minute and try again.
        </p>
      ) : null}
    </div>
  );
}
