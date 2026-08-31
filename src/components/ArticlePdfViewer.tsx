"use client";

import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function ArticlePdfViewer({
  fileId,
  title,
}: {
  fileId: string;
  title: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLabel, setPageLabel] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    let cancelled = false;
    host.replaceChildren();
    setReady(false);
    setPageLabel("");
    setError(null);

    (async () => {
      try {
        const response = await fetch(`/api/library/${fileId}/pdf`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          throw new Error("missing");
        }
        const data = new Uint8Array(await response.arrayBuffer());
        const pdf = await getDocument({ data }).promise;
        if (cancelled) {
          return;
        }
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = document.createElement("canvas");
          canvas.className = "pdf-canvas";
          canvas.setAttribute(
            "aria-label",
            `${title}, page ${pageNumber} of ${pdf.numPages}`,
          );
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("canvas");
          }
          host.append(canvas);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          if (cancelled) {
            return;
          }
          if (pageNumber === 1) {
            setReady(true);
          }
        }
        setPageLabel(
          pdf.numPages === 1 ? "1 page" : `${pdf.numPages} pages`,
        );
      } catch {
        if (!cancelled) {
          setError("This PDF could not be opened.");
        }
      }
    })();

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [fileId, title]);

  if (error) {
    return (
      <iframe
        className="pdf-fallback"
        title={title}
        src={`/api/library/${fileId}/pdf`}
      />
    );
  }

  return (
    <div className="pdf-frame" aria-busy={!ready}>
      {ready ? null : (
        <div className="pdf-pages" aria-hidden>
          <div className="skeleton skeleton--page" />
          <div className="skeleton skeleton--page skeleton--page-short" />
        </div>
      )}
      <div
        ref={hostRef}
        className="pdf-pages"
        hidden={!ready}
      />
      {pageLabel ? <p className="pdf-frame__hint">{pageLabel}</p> : null}
    </div>
  );
}
