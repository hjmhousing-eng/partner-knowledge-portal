import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import {
  boxCatalog,
  boxCollaborations,
  boxDocumentStore,
  boxLibrarySearch,
  boxPublicSearch,
} from "./adapters";
import { isBoxConfigured } from "./config";
import { getSdkLibraryPort } from "./sdkPort";
import {
  fixtureCatalog,
  fixtureCollaborations,
  fixtureStore,
  fixtureSearch,
  fixturePublicSearch,
} from "../fixtures/demoLibrary";
import { getDocument } from "../documents/getDocument";
import type { CollaborationLookup, FileId } from "../access/types";
import type { ArticleCatalog, LoadBody } from "../articles/loadArticlePage";
import type { LibrarySearch, PublicLibrarySearch } from "../ask/searchLibrary";
import type { EventLog } from "../webhooks/handleBoxDocumentWebhook";

export function portalCatalog(): ArticleCatalog {
  return {
    async bySlug(slug) {
      const entries = await getCachedPortalCatalog();
      return entries.find((entry) => entry.slug === slug) ?? null;
    },
    async byFileId(fileId) {
      const entries = await getCachedPortalCatalog();
      return entries.find((entry) => entry.fileId === fileId) ?? null;
    },
    list: getCachedPortalCatalog,
  };
}

async function loadPortalCatalog() {
  if (isBoxConfigured()) {
    return boxCatalog(getSdkLibraryPort()).list();
  }
  return fixtureCatalog.list();
}

/** Shared library shape only. Reader access stays outside this cache. */
export async function getCachedPortalCatalog() {
  "use cache";
  cacheTag("library");
  cacheLife("hours");
  return loadPortalCatalog();
}

export function portalCollaborations(): CollaborationLookup {
  if (isBoxConfigured()) {
    return boxCollaborations(getSdkLibraryPort());
  }
  return fixtureCollaborations;
}

export function portalPublicSearch(): PublicLibrarySearch {
  if (isBoxConfigured()) {
    return boxPublicSearch(getSdkLibraryPort());
  }
  return fixturePublicSearch;
}

export function portalSearch(): LibrarySearch {
  if (isBoxConfigured()) {
    return boxLibrarySearch(getSdkLibraryPort());
  }
  return fixtureSearch;
}

export function portalStore() {
  return isBoxConfigured()
    ? boxDocumentStore(getSdkLibraryPort())
    : fixtureStore;
}

/** Used inside getCachedArticle so the cache key stays fileId-only. */
export async function loadPortalArticle(fileId: FileId) {
  const store = isBoxConfigured()
    ? boxDocumentStore(getSdkLibraryPort())
    : fixtureStore;
  return getDocument(fileId, store);
}

export function portalLoadBody(): LoadBody {
  return loadPortalArticle;
}

const seenEventIds = new Set<string>();

export const memoryWebhookEvents: EventLog = {
  async alreadySeen(eventId) {
    return seenEventIds.has(eventId);
  },
  async markSeen(eventId) {
    seenEventIds.add(eventId);
  },
};

export async function revalidateDocumentTag(fileId: FileId) {
  revalidateTag(`doc:${fileId}`, "max");
}

export async function revalidateLibraryTag() {
  revalidateTag("library", "max");
}

export function portalBoxAi() {
  return {
    async ask(input: {
      fileIds: readonly FileId[];
      question: string;
      asUserId: string | null;
    }) {
      if (!isBoxConfigured()) {
        return null;
      }
      return getSdkLibraryPort().askFiles(
        input.fileIds,
        input.question,
        input.asUserId,
      );
    },
  };
}

export async function getPortalPdfDownloadUrl(
  fileId: FileId,
  asUserId: string | null,
): Promise<string | null> {
  if (!isBoxConfigured()) {
    return null;
  }
  return getSdkLibraryPort().getPdfDownloadUrl(fileId, asUserId);
}
