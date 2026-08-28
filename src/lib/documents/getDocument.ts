import type { FileId } from "../access/types";

export type ArticleFormat = "markdown" | "pdf";

export type ArticleBody = {
  fileId: FileId;
  title: string;
  format: ArticleFormat;
  markdown: string;
};

/**
 * Loads an article by Box file id only. Call canAccess first.
 * Cache tags belong in a Next.js wrapper, not in this interface.
 */
export type DocumentStore = {
  load(fileId: FileId): Promise<ArticleBody | null>;
};

export async function getDocument(
  fileId: FileId,
  store: DocumentStore,
): Promise<ArticleBody | null> {
  return store.load(fileId);
}
