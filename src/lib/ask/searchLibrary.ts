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

const QUESTION_PREFIX =
  /^(?:(?:can|could|would)\s+you\s+)?(?:tell\s+me\s+(?:about|more\s+about)|what\s+(?:is|are)|who\s+(?:is|are)|describe|explain|find|show\s+me)\s+/i;
const CURRENT_PAGE_REFERENCE =
  /\b(?:(?:this|current)\s+(?:page|article|product|controller|document|guide|datasheet)|here|on\s+(?:this|the current)\s+page)\b/i;

export function normalizeAskQuery(question: string): string {
  return question
    .trim()
    .replace(QUESTION_PREFIX, "")
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchCatalogMetadata(input: {
  reader: Reader;
  query: string;
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
}): Promise<LibraryHit[]> {
  const tokens = input.query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
  if (tokens.length === 0) {
    return [];
  }

  const entries = await input.catalog.list();
  const matches = await Promise.all(
    entries.map(async (entry) => {
      const haystack = `${entry.title} ${entry.slug}`.toLowerCase();
      if (!tokens.every((token) => haystack.includes(token))) {
        return null;
      }
      if (
        entry.audience === "partner" &&
        !(await canAccess(input.reader, entry.fileId, input.collaborations))
      ) {
        return null;
      }
      return {
        fileId: entry.fileId,
        title: entry.title,
        slug: entry.slug,
      };
    }),
  );

  return matches.filter((hit): hit is LibraryHit => hit !== null);
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

export type BoxAiAsk = {
  ask(input: {
    fileIds: readonly FileId[];
    question: string;
    asUserId: string | null;
  }): Promise<string | null>;
};

export type BoxAiSourceAnswer = {
  answer: string;
  sources: Array<{
    fileId: FileId;
    title: string;
    slug: string;
    href: string;
  }>;
};

export type RetrievedAskContext = {
  notes: string;
  sources: BoxAiSourceAnswer["sources"];
};

export type AskRetrievalStage =
  | "catalog"
  | "access_gate"
  | "box_search"
  | "box_ai"
  | "article_text";

export class AskRetrievalError extends Error {
  constructor(
    readonly stage: AskRetrievalStage,
    readonly statusCode?: number,
  ) {
    super(`ask_retrieval_${stage}`);
    this.name = "AskRetrievalError";
  }
}

function errorStatus(error: unknown): number | undefined {
  try {
    if (typeof error !== "object" || error === null) {
      return undefined;
    }
    const details = error as Record<string, unknown>;
    const responseInfo = details.responseInfo as
      | Record<string, unknown>
      | undefined;
    const status = responseInfo?.statusCode ?? details.statusCode;
    return typeof status === "number" ? status : undefined;
  } catch {
    return undefined;
  }
}

async function atRetrievalStage<T>(
  stage: AskRetrievalStage,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AskRetrievalError) {
      throw error;
    }
    throw new AskRetrievalError(stage, errorStatus(error));
  }
}

/**
 * Ask-tool: Box AI on files this reader may open. Public = CCG.
 * Partner = as-user after the gate. Never mix those actors.
 */
export async function askBoxAiSources(input: {
  reader: Reader;
  fileIds: readonly FileId[];
  question: string;
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
  boxAi: BoxAiAsk;
}): Promise<BoxAiSourceAnswer | null> {
  const publicIds: FileId[] = [];
  const partnerIds: FileId[] = [];
  const sources: BoxAiSourceAnswer["sources"] = [];

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
      partnerIds.push(fileId);
    } else {
      publicIds.push(fileId);
    }
    sources.push({
      fileId,
      title: entry.title,
      slug: entry.slug,
      href: citationHref(entry.slug),
    });
  }

  const chunks: string[] = [];
  if (publicIds.length > 0) {
    const answer = await input.boxAi.ask({
      fileIds: publicIds,
      question: input.question,
      asUserId: null,
    });
    if (answer) {
      chunks.push(answer);
    }
  }
  if (
    partnerIds.length > 0 &&
    input.reader.kind === "boxUser"
  ) {
    const answer = await input.boxAi.ask({
      fileIds: partnerIds,
      question: input.question,
      asUserId: input.reader.boxUserId,
    });
    if (answer) {
      chunks.push(answer);
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  return {
    answer: chunks.join("\n\n"),
    sources,
  };
}

export async function retrieveAskContext(input: {
  reader: Reader;
  question: string;
  currentPageFileId?: FileId;
  search: AskSearchPorts;
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
  boxAi: BoxAiAsk;
  store: DocumentStore;
}): Promise<RetrievedAskContext | null> {
  const catalog: ArticleCatalog = {
    bySlug: (slug) =>
      atRetrievalStage("catalog", () => input.catalog.bySlug(slug)),
    byFileId: (fileId) =>
      atRetrievalStage("catalog", () => input.catalog.byFileId(fileId)),
    list: () => atRetrievalStage("catalog", () => input.catalog.list()),
  };
  const collaborations: CollaborationLookup = {
    hasAccess: (boxUserId, fileId) =>
      atRetrievalStage("access_gate", () =>
        input.collaborations.hasAccess(boxUserId, fileId),
      ),
  };
  const search: AskSearchPorts = {
    asUser: {
      searchAsUser: (boxUserId, query) =>
        atRetrievalStage("box_search", () =>
          input.search.asUser.searchAsUser(boxUserId, query),
        ),
    },
    public: {
      searchPublic: (query) =>
        atRetrievalStage("box_search", () =>
          input.search.public.searchPublic(query),
        ),
    },
  };
  const boxAi: BoxAiAsk = {
    ask: (request) =>
      atRetrievalStage("box_ai", () => input.boxAi.ask(request)),
  };
  const store: DocumentStore = {
    load: (fileId) =>
      atRetrievalStage("article_text", () => input.store.load(fileId)),
  };

  const query = normalizeAskQuery(input.question);
  const catalogHits = await searchCatalogMetadata({
    reader: input.reader,
    query,
    catalog,
    collaborations,
  });
  const searchedHits =
    catalogHits.length > 0
      ? catalogHits
      : await searchLibrary(input.reader, query, search);
  const currentEntry = input.currentPageFileId
    ? await catalog.byFileId(input.currentPageFileId)
    : null;
  const includeCurrentEntry =
    currentEntry !== null &&
    (searchedHits.length === 0 || CURRENT_PAGE_REFERENCE.test(input.question));
  const fileIds = [
    ...(includeCurrentEntry ? [currentEntry.fileId] : []),
    ...searchedHits.map((hit) => hit.fileId),
  ]
    .filter((fileId, index, values) => values.indexOf(fileId) === index)
    .slice(0, 5);
  if (fileIds.length === 0) {
    return null;
  }

  let boxAiFailure: AskRetrievalError | null = null;
  let boxAiAnswer: BoxAiSourceAnswer | null = null;
  try {
    boxAiAnswer = await askBoxAiSources({
      reader: input.reader,
      fileIds,
      question: input.question,
      catalog,
      collaborations,
      boxAi,
    });
  } catch (error) {
    if (!(error instanceof AskRetrievalError) || error.stage !== "box_ai") {
      throw error;
    }
    boxAiFailure = error;
    console.warn(
      `Ask retrieval degraded: ${JSON.stringify({
        stage: error.stage,
        statusCode: error.statusCode,
        fallback: "article_text",
      })}`,
    );
  }
  if (boxAiAnswer) {
    return {
      notes: boxAiAnswer.answer,
      sources: boxAiAnswer.sources,
    };
  }

  const passages = await loadAskPassages({
    reader: input.reader,
    fileIds,
    catalog,
    collaborations,
    store,
  });
  if (passages.length === 0) {
    if (boxAiFailure) {
      throw boxAiFailure;
    }
    return null;
  }

  return {
    notes: passages
      .map((passage) => `${passage.title}\n${passage.markdown}`)
      .join("\n\n"),
    sources: passages.map(({ fileId, title, slug, href }) => ({
      fileId,
      title,
      slug,
      href,
    })),
  };
}
