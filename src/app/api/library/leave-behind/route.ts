import { draftLeaveBehind } from "@/lib/ask/leaveBehind";
import { composeLeaveBehind } from "@/lib/ask/composeLeaveBehind";
import { getCachedArticle } from "@/lib/documents/getCachedArticle";
import {
  portalBoxAi,
  portalCatalog,
  portalCollaborations,
} from "@/lib/box/runtime";
import { readSessionReader } from "@/lib/session/readSessionReader";

/** Per-request compose. Do not cache. 404 not 403. */
export async function POST(request: Request) {
  const reader = await readSessionReader();
  let fileId = "";
  try {
    const body = (await request.json()) as { fileId?: string };
    fileId = body.fileId?.trim() ?? "";
  } catch {
    fileId = "";
  }
  if (!fileId) {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  try {
    const result = await draftLeaveBehind({
      reader,
      fileId,
      catalog: portalCatalog(),
      collaborations: portalCollaborations(),
      boxAi: portalBoxAi(),
      compose: composeLeaveBehind,
      loadBody: getCachedArticle,
    });

    if (result.status === "not_found") {
      return Response.json({ status: "not_found" }, { status: 404 });
    }

    return Response.json(result);
  } catch {
    return Response.json({ status: "not_found" }, { status: 404 });
  }
}
