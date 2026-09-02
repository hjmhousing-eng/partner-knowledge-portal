import { describe, expect, it } from "vitest";
import {
  askBoxAiSources,
  citationHref,
  loadAskPassages,
  normalizeAskQuery,
  retrieveAskContext,
  searchLibrary,
} from "./searchLibrary";
import type { AskSearchPorts, LibraryHit, LibrarySearch } from "./searchLibrary";
import type { ArticleCatalog, CatalogEntry } from "../articles/loadArticlePage";
import type { ArticleBody, DocumentStore } from "../documents/getDocument";
import type { CollaborationLookup } from "../access/types";

type StoredHit = LibraryHit & { ownerId: string };

function searchFromHits(hits: readonly StoredHit[]): LibrarySearch {
  return {
    async searchAsUser(boxUserId, query) {
      const needle = query.toLowerCase();
      return hits
        .filter(
          (hit) =>
            hit.ownerId === boxUserId &&
            hit.title.toLowerCase().includes(needle),
        )
        .map(({ fileId, title, slug }) => ({ fileId, title, slug }));
    },
  };
}

const silentAsUser: LibrarySearch = {
  async searchAsUser() {
    throw new Error("anonymous readers must not search Box as-user");
  },
};

describe("searchLibrary", () => {
  const janeBattlecard: StoredHit = {
    fileId: "file_1",
    ownerId: "user_jane",
    title: "SKU-A battlecard",
    slug: "sku-a/battlecard",
  };
  const priyaPricing: StoredHit = {
    fileId: "file_2",
    ownerId: "user_priya",
    title: "SKU-A pricing",
    slug: "sku-a/pricing",
  };
  const publicWelcome: LibraryHit = {
    fileId: "file_public",
    title: "Welcome",
    slug: "welcome",
  };

  const ports = (asUser: LibrarySearch): AskSearchPorts => ({
    asUser,
    public: {
      async searchPublic(query) {
        const needle = query.toLowerCase();
        return publicWelcome.title.toLowerCase().includes(needle)
          ? [publicWelcome]
          : [];
      },
    },
  });

  it("returns public hits for an anonymous reader without as-user search", async () => {
    await expect(
      searchLibrary({ kind: "anonymous" }, "Welcome", {
        asUser: silentAsUser,
        public: ports(silentAsUser).public,
      }),
    ).resolves.toEqual([publicWelcome]);
  });

  it("returns only hits the partner is allowed to see", async () => {
    const hits = await searchLibrary(
      { kind: "boxUser", boxUserId: "user_jane" },
      "SKU-A",
      ports(searchFromHits([janeBattlecard, priyaPricing])),
    );

    expect(hits).toEqual([
      {
        fileId: "file_1",
        title: "SKU-A battlecard",
        slug: "sku-a/battlecard",
      },
    ]);
  });
});

describe("citationHref", () => {
  it("builds a site path from a slug, not a Box URL", () => {
    expect(citationHref("sku-a/battlecard")).toBe("/products/sku-a/battlecard");
    expect(citationHref("sku-a/battlecard")).not.toContain("box.com");
  });
});

describe("loadAskPassages", () => {
  const publicWelcome: CatalogEntry = {
    fileId: "file_public",
    slug: "welcome",
    audience: "public",
    title: "Welcome",
    format: "markdown",
  };
  const partnerBattlecard: CatalogEntry = {
    fileId: "file_1",
    slug: "sku-a/battlecard",
    audience: "partner",
    title: "SKU-A battlecard",
    format: "markdown",
  };

  const catalog: ArticleCatalog = {
    async bySlug() {
      return null;
    },
    async byFileId(fileId) {
      if (fileId === "file_public") {
        return publicWelcome;
      }
      if (fileId === "file_1") {
        return partnerBattlecard;
      }
      return null;
    },
    async list() {
      return [publicWelcome, partnerBattlecard];
    },
  };

  const store: DocumentStore = {
    async load(fileId) {
      const articles: Record<string, ArticleBody> = {
        file_public: {
          fileId: "file_public",
          title: "Welcome",
          format: "markdown",
          markdown: "This page is public.",
        },
        file_1: {
          fileId: "file_1",
          title: "SKU-A battlecard",
          format: "markdown",
          markdown: "Lead with reliability.",
        },
      };
      return articles[fileId] ?? null;
    },
  };

  const janeOnly: CollaborationLookup = {
    async hasAccess(boxUserId, fileId) {
      return boxUserId === "user_jane" && fileId === "file_1";
    },
  };

  it("loads public passages for an anonymous reader and omits partner files", async () => {
    const passages = await loadAskPassages({
      reader: { kind: "anonymous" },
      fileIds: ["file_public", "file_1"],
      catalog,
      collaborations: janeOnly,
      store,
    });

    expect(passages).toEqual([
      {
        fileId: "file_public",
        title: "Welcome",
        slug: "welcome",
        href: "/products/welcome",
        markdown: "This page is public.",
      },
    ]);
  });

  it("loads a partner passage only when the Box user can open the file", async () => {
    const allowed = await loadAskPassages({
      reader: { kind: "boxUser", boxUserId: "user_jane" },
      fileIds: ["file_1"],
      catalog,
      collaborations: janeOnly,
      store,
    });
    expect(allowed).toHaveLength(1);
    expect(allowed[0]?.href).toBe("/products/sku-a/battlecard");

    const denied = await loadAskPassages({
      reader: { kind: "boxUser", boxUserId: "user_priya" },
      fileIds: ["file_1"],
      catalog,
      collaborations: janeOnly,
      store,
    });
    expect(denied).toEqual([]);
  });

  it("skips PDF bodies so ask does not ingest binary", async () => {
    const pdfEntry: CatalogEntry = {
      fileId: "file_pdf",
      slug: "sku-a/datasheet",
      audience: "public",
      title: "SKU-A · Datasheet",
      format: "pdf",
    };
    const passages = await loadAskPassages({
      reader: { kind: "anonymous" },
      fileIds: ["file_pdf"],
      catalog: {
        ...catalog,
        async byFileId(fileId) {
          return fileId === "file_pdf" ? pdfEntry : catalog.byFileId(fileId);
        },
      },
      collaborations: janeOnly,
      store: {
        async load(fileId) {
          if (fileId === "file_pdf") {
            return {
              fileId,
              title: "SKU-A · Datasheet",
              format: "pdf",
              markdown: "",
            };
          }
          return store.load(fileId);
        },
      },
    });
    expect(passages).toEqual([]);
  });
});

describe("askBoxAiSources", () => {
  const publicWelcome: CatalogEntry = {
    fileId: "file_public",
    slug: "welcome",
    audience: "public",
    title: "Welcome",
    format: "markdown",
  };
  const partnerBattlecard: CatalogEntry = {
    fileId: "file_1",
    slug: "sku-a/battlecard",
    audience: "partner",
    title: "SKU-A battlecard",
    format: "markdown",
  };
  const catalog: ArticleCatalog = {
    async bySlug() {
      return null;
    },
    async byFileId(fileId) {
      if (fileId === "file_public") {
        return publicWelcome;
      }
      if (fileId === "file_1") {
        return partnerBattlecard;
      }
      return null;
    },
    async list() {
      return [publicWelcome, partnerBattlecard];
    },
  };
  const janeOnly: CollaborationLookup = {
    async hasAccess(boxUserId, fileId) {
      return boxUserId === "user_jane" && fileId === "file_1";
    },
  };

  it("asks Box AI as CCG for public files and omits partner ids", async () => {
    const asked: Array<{ fileIds: string[]; asUserId: string | null }> = [];
    const result = await askBoxAiSources({
      reader: { kind: "anonymous" },
      fileIds: ["file_public", "file_1"],
      question: "What is SKU-A?",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask({ fileIds, asUserId }) {
          asked.push({ fileIds: [...fileIds], asUserId });
          return "Public overview only.";
        },
      },
    });

    expect(asked).toEqual([
      { fileIds: ["file_public"], asUserId: null },
    ]);
    expect(result).toEqual({
      answer: "Public overview only.",
      sources: [
        {
          fileId: "file_public",
          title: "Welcome",
          slug: "welcome",
          href: "/products/welcome",
        },
      ],
    });
  });

  it("asks Box AI as-user for partner files the reader can open", async () => {
    const asked: Array<{ fileIds: string[]; asUserId: string | null }> = [];
    const result = await askBoxAiSources({
      reader: { kind: "boxUser", boxUserId: "user_jane" },
      fileIds: ["file_1"],
      question: "Competitor handling?",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask({ fileIds, asUserId }) {
          asked.push({ fileIds: [...fileIds], asUserId });
          return "Lead with uptime.";
        },
      },
    });

    expect(asked).toEqual([
      { fileIds: ["file_1"], asUserId: "user_jane" },
    ]);
    expect(result?.sources[0]?.href).toBe("/products/sku-a/battlecard");
  });

  it("returns null when Box AI has no allowed files or no answer", async () => {
    await expect(
      askBoxAiSources({
        reader: { kind: "anonymous" },
        fileIds: ["file_1"],
        question: "pricing",
        catalog,
        collaborations: janeOnly,
        boxAi: {
          async ask() {
            throw new Error("must not call Box AI");
          },
        },
      }),
    ).resolves.toBeNull();
  });
});

describe("retrieveAskContext", () => {
  it("uses cached catalog metadata before searching Box", async () => {
    let searches = 0;
    let asks = 0;
    const entry: CatalogEntry = {
      fileId: "file_public",
      slug: "sku-a/overview",
      audience: "public",
      title: "SKU-A overview",
      format: "markdown",
    };

    const result = await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "What is SKU-A?",
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic() {
            searches += 1;
            return [entry];
          },
        },
      },
      catalog: {
        async bySlug() {
          return entry;
        },
        async byFileId() {
          return entry;
        },
        async list() {
          return [entry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask() {
          asks += 1;
          return "SKU-A is a configurable controller.";
        },
      },
      store: {
        async load() {
          throw new Error("Box AI answered; text fallback must not run");
        },
      },
    });

    expect(searches).toBe(0);
    expect(asks).toBe(1);
    expect(result?.notes).toContain("configurable controller");
    expect(result?.sources[0]?.href).toBe("/products/sku-a/overview");
  });

  it("normalizes a natural-language question before searching Box", async () => {
    let boxQuery = "";
    const result = await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "Tell me about the Pulse controller?",
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic(query) {
            boxQuery = query;
            return [];
          },
        },
      },
      catalog: {
        async bySlug() {
          return null;
        },
        async byFileId() {
          return null;
        },
        async list() {
          return [];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask() {
          throw new Error("no hits means Box AI must not run");
        },
      },
      store: {
        async load() {
          throw new Error("no hits means text fallback must not run");
        },
      },
    });

    expect(boxQuery).toBe("Pulse controller");
    expect(result).toBeNull();
  });

  it("uses the current article when the question refers to the page", async () => {
    const entry: CatalogEntry = {
      fileId: "pulse",
      slug: "pulse/overview",
      audience: "public",
      title: "Pulse Controller",
      format: "markdown",
    };
    let askedFileIds: readonly string[] = [];

    const result = await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "What does this product do?",
      currentPageFileId: "pulse",
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic() {
            return [];
          },
        },
      },
      catalog: {
        async bySlug() {
          return entry;
        },
        async byFileId(fileId) {
          return fileId === entry.fileId ? entry : null;
        },
        async list() {
          return [entry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask({ fileIds }) {
          askedFileIds = fileIds;
          return "Pulse sequences packaged equipment.";
        },
      },
      store: {
        async load() {
          throw new Error("Box AI answered; text fallback must not run");
        },
      },
    });

    expect(askedFileIds).toEqual(["pulse"]);
    expect(result?.notes).toContain("packaged equipment");
  });

  it("lets an explicit library match override the current article", async () => {
    const currentEntry: CatalogEntry = {
      fileId: "pulse",
      slug: "pulse/overview",
      audience: "public",
      title: "Pulse Controller",
      format: "markdown",
    };
    const matchedEntry: CatalogEntry = {
      fileId: "air-pricing",
      slug: "air-handler/pricing",
      audience: "public",
      title: "Air Handler pricing",
      format: "markdown",
    };
    let askedFileIds: readonly string[] = [];

    await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "Tell me about Air Handler pricing",
      currentPageFileId: currentEntry.fileId,
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic() {
            throw new Error("catalog metadata should match this question");
          },
        },
      },
      catalog: {
        async bySlug() {
          return null;
        },
        async byFileId(fileId) {
          return [currentEntry, matchedEntry].find(
            (entry) => entry.fileId === fileId,
          ) ?? null;
        },
        async list() {
          return [currentEntry, matchedEntry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask({ fileIds }) {
          askedFileIds = fileIds;
          return "Air Handler pricing is account-specific.";
        },
      },
      store: {
        async load() {
          throw new Error("Box AI answered; text fallback must not run");
        },
      },
    });

    expect(askedFileIds).toEqual(["air-pricing"]);
  });

  it("limits a pinned question to the current article", async () => {
    const currentEntry: CatalogEntry = {
      fileId: "pulse",
      slug: "pulse/overview",
      audience: "public",
      title: "Pulse Controller",
      format: "markdown",
    };
    const matchedEntry: CatalogEntry = {
      fileId: "air-pricing",
      slug: "air-handler/pricing",
      audience: "public",
      title: "Air Handler pricing",
      format: "markdown",
    };
    let askedFileIds: readonly string[] = [];

    await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "Tell me about Air Handler pricing",
      currentPageFileId: currentEntry.fileId,
      currentPageScope: "page",
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic() {
            throw new Error("catalog metadata should match this question");
          },
        },
      },
      catalog: {
        async bySlug() {
          return null;
        },
        async byFileId(fileId) {
          return (
            [currentEntry, matchedEntry].find(
              (entry) => entry.fileId === fileId,
            ) ?? null
          );
        },
        async list() {
          return [currentEntry, matchedEntry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask({ fileIds }) {
          askedFileIds = fileIds;
          return "Pulse sequences packaged equipment.";
        },
      },
      store: {
        async load() {
          throw new Error("Box AI answered; text fallback must not run");
        },
      },
    });

    expect(askedFileIds).toEqual(["pulse"]);
  });

  it("does not use current-page context when the reader cannot open it", async () => {
    const entry: CatalogEntry = {
      fileId: "partner-pricing",
      slug: "pulse/pricing",
      audience: "partner",
      title: "Pulse pricing",
      format: "markdown",
    };

    const result = await retrieveAskContext({
      reader: { kind: "boxUser", boxUserId: "riley" },
      question: "What does this page say?",
      currentPageFileId: entry.fileId,
      search: {
        asUser: {
          async searchAsUser() {
            return [];
          },
        },
        public: {
          async searchPublic() {
            return [];
          },
        },
      },
      catalog: {
        async bySlug() {
          return entry;
        },
        async byFileId() {
          return entry;
        },
        async list() {
          return [entry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask() {
          throw new Error("denied context must not reach Box AI");
        },
      },
      store: {
        async load() {
          throw new Error("denied context must not load article text");
        },
      },
    });

    expect(result).toBeNull();
  });

  it("identifies a catalog failure without serializing the provider error", async () => {
    await expect(
      retrieveAskContext({
        reader: { kind: "anonymous" },
        question: "Pulse",
        search: {
          asUser: silentAsUser,
          public: {
            async searchPublic() {
              return [];
            },
          },
        },
        catalog: {
          async bySlug() {
            return null;
          },
          async byFileId() {
            return null;
          },
          async list() {
            throw new Error("provider details");
          },
        },
        collaborations: {
          async hasAccess() {
            return false;
          },
        },
        boxAi: {
          async ask() {
            return null;
          },
        },
        store: {
          async load() {
            return null;
          },
        },
      }),
    ).rejects.toMatchObject({
      name: "AskRetrievalError",
      stage: "catalog",
    });
  });

  it("falls back to article text when Box AI fails", async () => {
    const entry: CatalogEntry = {
      fileId: "pulse",
      slug: "pulse/overview",
      audience: "public",
      title: "Pulse Controller",
      format: "markdown",
    };
    const result = await retrieveAskContext({
      reader: { kind: "anonymous" },
      question: "Pulse controller",
      search: {
        asUser: silentAsUser,
        public: {
          async searchPublic() {
            return [];
          },
        },
      },
      catalog: {
        async bySlug() {
          return entry;
        },
        async byFileId() {
          return entry;
        },
        async list() {
          return [entry];
        },
      },
      collaborations: {
        async hasAccess() {
          return false;
        },
      },
      boxAi: {
        async ask() {
          throw new Error("Box AI unavailable");
        },
      },
      store: {
        async load() {
          return {
            fileId: "pulse",
            title: "Pulse Controller",
            format: "markdown",
            markdown: "Pulse sequences packaged equipment.",
          };
        },
      },
    });

    expect(result?.notes).toContain("packaged equipment");
    expect(result?.sources[0]?.href).toBe("/products/pulse/overview");
  });
});

describe("normalizeAskQuery", () => {
  it("removes conversational framing without dropping the subject", () => {
    expect(normalizeAskQuery("Could you tell me about Pulse controller?")).toBe(
      "Pulse controller",
    );
  });
});
