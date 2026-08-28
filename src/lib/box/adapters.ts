import type { CollaborationLookup } from "../access/types";
import type { ArticleCatalog } from "../articles/loadArticlePage";
import type { DocumentStore } from "../documents/getDocument";
import type { LibrarySearch, PublicLibrarySearch } from "../ask/searchLibrary";
import type { BoxLibraryPort } from "./port";

export function boxCollaborations(port: BoxLibraryPort): CollaborationLookup {
  return {
    hasAccess(boxUserId, fileId) {
      return port.probeFileAsUser(boxUserId, fileId);
    },
  };
}

export function boxDocumentStore(port: BoxLibraryPort): DocumentStore {
  return {
    load(fileId) {
      return port.loadArticle(fileId);
    },
  };
}

export function boxCatalog(port: BoxLibraryPort): ArticleCatalog {
  return {
    async bySlug(slug) {
      const entries = await port.listCatalog();
      return entries.find((entry) => entry.slug === slug) ?? null;
    },
    async byFileId(fileId) {
      const entries = await port.listCatalog();
      return entries.find((entry) => entry.fileId === fileId) ?? null;
    },
    async list() {
      return port.listCatalog();
    },
  };
}

export function boxPublicSearch(port: BoxLibraryPort): PublicLibrarySearch {
  return {
    async searchPublic(query) {
      const needle = query.toLowerCase();
      const entries = await port.listCatalog();
      return entries
        .filter(
          (entry) =>
            entry.audience === "public" &&
            (entry.title.toLowerCase().includes(needle) ||
              entry.slug.toLowerCase().includes(needle)),
        )
        .map((entry) => ({
          fileId: entry.fileId,
          title: entry.title,
          slug: entry.slug,
        }));
    },
  };
}

export function boxLibrarySearch(port: BoxLibraryPort): LibrarySearch {
  return {
    async searchAsUser(boxUserId, query) {
      const fileIds = await port.searchAsUser(boxUserId, query);
      const catalog = await port.listCatalog();
      const byId = new Map(catalog.map((entry) => [entry.fileId, entry]));
      return fileIds.flatMap((fileId) => {
        const entry = byId.get(fileId);
        if (!entry) {
          return [];
        }
        return [
          {
            fileId,
            title: entry.title,
            slug: entry.slug,
          },
        ];
      });
    },
  };
}
