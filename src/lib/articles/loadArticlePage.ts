import { canAccess } from "../access/canAccess";
import type { CollaborationLookup, FileId, Reader } from "../access/types";
import type { ArticleBody, ArticleFormat } from "../documents/getDocument";

export type Audience = "public" | "partner";

export type CatalogEntry = {
  fileId: FileId;
  slug: string;
  audience: Audience;
  title: string;
  format: ArticleFormat;
};

export type ArticleCatalog = {
  bySlug(slug: string): Promise<CatalogEntry | null>;
  byFileId(fileId: FileId): Promise<CatalogEntry | null>;
  list(): Promise<CatalogEntry[]>;
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

  if (!(await gateCatalogEntry(input.reader, entry, input.collaborations))) {
    return { status: "not_found" };
  }

  const article = await input.loadBody(entry.fileId);
  if (!article) {
    return { status: "not_found" };
  }

  return { status: "ok", article };
}

/** Same gate as the article page. Partner files need a Box collab; 404 not 403. */
export async function gateCatalogEntry(
  reader: Reader,
  entry: CatalogEntry,
  collaborations: CollaborationLookup,
): Promise<boolean> {
  if (entry.audience !== "partner") {
    return true;
  }
  return canAccess(reader, entry.fileId, collaborations);
}
