import { canAccess } from "../access/canAccess";
import type { CollaborationLookup, FileId, Reader } from "../access/types";
import type { ArticleBody } from "../documents/getDocument";

export type Audience = "public" | "partner";

export type CatalogEntry = {
  fileId: FileId;
  slug: string;
  audience: Audience;
};

export type ArticleCatalog = {
  bySlug(slug: string): Promise<CatalogEntry | null>;
};

export type LoadBody = (fileId: FileId) => Promise<ArticleBody | null>;

export type ArticlePageResult =
  | { status: "not_found" }
  | { status: "ok"; article: ArticleBody };

/**
 * Sequence 1: resolve slug, gate partner docs, load identity-free body.
 * Unknown or forbidden → not_found (404), never 403.
 */
export async function loadArticlePage(input: {
  reader: Reader;
  slug: string;
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
  loadBody: LoadBody;
}): Promise<ArticlePageResult> {
  const entry = await input.catalog.bySlug(input.slug);
  if (!entry) {
    return { status: "not_found" };
  }

  if (entry.audience === "partner") {
    const allowed = await canAccess(
      input.reader,
      entry.fileId,
      input.collaborations,
    );
    if (!allowed) {
      return { status: "not_found" };
    }
  }

  const article = await input.loadBody(entry.fileId);
  if (!article) {
    return { status: "not_found" };
  }

  return { status: "ok", article };
}
