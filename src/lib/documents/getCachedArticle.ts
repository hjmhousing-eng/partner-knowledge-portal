import { cacheLife, cacheTag } from "next/cache";
import { getDocument } from "./getDocument";
import { fixtureStore } from "../fixtures/demoLibrary";
import type { FileId } from "../access/types";

/**
 * Identity-free cached body. Store is created inside this function so the
 * cache key is only fileId (ADR 0002). Swap fixtureStore for Box later.
 */
export async function getCachedArticle(fileId: FileId) {
  "use cache";
  cacheTag(`doc:${fileId}`);
  cacheLife("hours");
  return getDocument(fileId, fixtureStore);
}
