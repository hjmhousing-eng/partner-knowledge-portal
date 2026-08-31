"use client";

import { useState } from "react";
import { ArticleMarkdown } from "./ArticleMarkdown";

export function LeaveBehindDraft({
  fileId,
  title,
}: {
  fileId: string;
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);

  async function draft() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/library/leave-behind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ fileId }),
      });
      if (!response.ok) {
        throw new Error("missing");
      }
      const payload = (await response.json()) as { markdown?: string };
      if (!payload.markdown) {
        throw new Error("missing");
      }
      setMarkdown(payload.markdown);
    } catch {
      setError("Could not draft a leave-behind from this document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="leave-behind">
      <div className="leave-behind__bar">
        <p>Prepare a one-page brief from this article. Box AI reads the file; the site writes the draft.</p>
        <button type="button" onClick={() => void draft()} disabled={busy}>
          {busy ? "Drafting…" : "Draft leave-behind"}
        </button>
      </div>
      {error ? <p className="ask-error">{error}</p> : null}
      {markdown ? (
        <div className="leave-behind__draft">
          <h2>Leave-behind · {title}</h2>
          <ArticleMarkdown markdown={markdown} />
        </div>
      ) : null}
    </section>
  );
}
