import { revalidateTag } from "next/cache";
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
  if (isBoxConfigured()) {
    return boxCatalog(getSdkLibraryPort());
  }
  return fixtureCatalog;
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

export async function downloadPortalPdf(
  fileId: FileId,
  asUserId: string | null,
): Promise<Uint8Array | null> {
  if (!isBoxConfigured()) {
    return null;
  }
  return getSdkLibraryPort().downloadPdf(fileId, asUserId);
}
