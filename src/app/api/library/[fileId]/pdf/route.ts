import { gateCatalogEntry } from "@/lib/articles/loadArticlePage";
import {
  downloadPortalPdf,
  portalCatalog,
  portalCollaborations,
} from "@/lib/box/runtime";
import { readSessionReader } from "@/lib/session/readSessionReader";

function inlineFilename(slug: string) {
  return `${slug.replaceAll("/", "-")}.pdf`;
}

/** PDF bytes after the gate. 404 not 403. Partner files download as-user. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params;
  const reader = await readSessionReader();
  const entry = await portalCatalog().byFileId(fileId);
  if (!entry || entry.format !== "pdf") {
    return new Response(null, { status: 404 });
  }
  if (!(await gateCatalogEntry(reader, entry, portalCollaborations()))) {
    return new Response(null, { status: 404 });
  }

  const asUserId =
    entry.audience === "partner" && reader.kind === "boxUser"
      ? reader.boxUserId
      : null;
  const bytes = await downloadPortalPdf(fileId, asUserId);
  if (!bytes) {
    return new Response(null, { status: 404 });
  }

  const copy = Uint8Array.from(bytes);
  return new Response(copy.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inlineFilename(entry.slug)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
