import { cacheLife, cacheTag } from "next/cache";
import { loadPortalArticle } from "../box/runtime";
import type { FileId } from "../access/types";

/**
 * Identity-free cached body. Store is chosen inside loadPortalArticle so the
 * cache key stays fileId-only (ADR 0002). Do not pass userId in here.
 * PDFs cache metadata only; bytes are streamed after the gate, not stored here.
 */
export async function getCachedArticle(fileId: FileId) {
  "use cache";
  cacheTag(`doc:${fileId}`);
  cacheLife("hours");
  return loadPortalArticle(fileId);
}
