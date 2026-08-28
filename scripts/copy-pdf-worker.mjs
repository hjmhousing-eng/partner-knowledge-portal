import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Same-origin worker so PDF.js does not load Box or a CDN from the reader page. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(
  root,
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs",
);
const toDir = join(root, "public");
mkdirSync(toDir, { recursive: true });
copyFileSync(from, join(toDir, "pdf.worker.min.mjs"));
