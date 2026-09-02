import type { CatalogEntry } from "../articles/loadArticlePage";
import type { ArticleBody } from "../documents/getDocument";
import type { FileId } from "../access/types";

export type BoxLibraryPort = {
  probeFileAsUser(boxUserId: string, fileId: FileId): Promise<boolean>;
  loadArticle(fileId: FileId): Promise<ArticleBody | null>;
  listCatalog(): Promise<CatalogEntry[]>;
  searchAsUser(boxUserId: string, query: string): Promise<FileId[]>;
  /** Short-lived Box delivery URL after the gate. Public = CCG; partner = as-user. */
  getPdfDownloadUrl(
    fileId: FileId,
    asUserId: string | null,
  ): Promise<string | null>;
  /**
   * Box AI on these file ids. Public = CCG. Partner = as-user.
   * Returns null when the tenant cannot answer.
   */
  askFiles(
    fileIds: readonly FileId[],
    question: string,
    asUserId: string | null,
  ): Promise<string | null>;
};
