import type { CollaborationLookup, FileId, Reader } from "../access/types";
import type { ArticleCatalog } from "../articles/loadArticlePage";
import type { DocumentStore } from "../documents/getDocument";
import { canAccess } from "../access/canAccess";
import { getDocument } from "../documents/getDocument";

export type LibraryHit = {
  fileId: FileId;
  title: string;
  slug: string;
};

export type LibrarySearch = {
  searchAsUser(boxUserId: string, query: string): Promise<LibraryHit[]>;
};

export type PublicLibrarySearch = {
  searchPublic(query: string): Promise<LibraryHit[]>;
};

export type AskSearchPorts = {
  asUser: LibrarySearch;
  public: PublicLibrarySearch;
};

/**
 * Ask-tool: anonymous searches public catalog only (CCG listing).
 * Partners search Box as-user. Never mix those paths.
 */
export async function searchLibrary(
  reader: Reader,
  query: string,
  ports: AskSearchPorts,
): Promise<LibraryHit[]> {
  if (reader.kind === "anonymous") {
    return ports.public.searchPublic(query);
  }

  return ports.asUser.searchAsUser(reader.boxUserId, query);
}

/** Citations in answers are portal routes, not box.com file links. */
export function citationHref(slug: string): string {
  const path = slug.replace(/^\/+/, "");
  return `/products/${path}`;
}

export type AskPassage = {
  fileId: FileId;
  title: string;
  slug: string;
  href: string;
  markdown: string;
};

const MAX_PASSAGE_CHARS = 4000;

/**
 * Ask-tool: load bodies only for ids this reader may see. Partner files go
 * through the gate; public files do not. Ask responses are never cached.
 */
export async function loadAskPassages(input: {
  reader: Reader;
  fileIds: readonly FileId[];
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
  store: DocumentStore;
}): Promise<AskPassage[]> {
  const passages: AskPassage[] = [];

  for (const fileId of input.fileIds) {
    const entry = await input.catalog.byFileId(fileId);
    if (!entry) {
      continue;
    }

    if (entry.audience === "partner") {
      const allowed = await canAccess(
        input.reader,
        fileId,
        input.collaborations,
      );
      if (!allowed) {
        continue;
      }
    }

    const article = await getDocument(fileId, input.store);
    if (!article || article.format === "pdf" || !article.markdown) {
      continue;
    }

    passages.push({
      fileId,
      title: article.title,
      slug: entry.slug,
      href: citationHref(entry.slug),
      markdown: article.markdown.slice(0, MAX_PASSAGE_CHARS),
    });
  }

  return passages;
}
