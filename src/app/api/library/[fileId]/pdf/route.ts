import { gateCatalogEntry } from "@/lib/articles/loadArticlePage";
import {
  getPortalPdfDownloadUrl,
  portalCatalog,
  portalCollaborations,
} from "@/lib/box/runtime";
import { readSessionReader } from "@/lib/session/readSessionReader";

/** The gate stays live; Box carries the permitted file bytes to the reader. */
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
  const downloadUrl = await getPortalPdfDownloadUrl(fileId, asUserId);
  if (!downloadUrl) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: downloadUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
