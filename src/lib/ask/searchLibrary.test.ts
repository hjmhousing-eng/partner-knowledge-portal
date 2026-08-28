import { describe, expect, it } from "vitest";
import {
  citationHref,
  loadAskPassages,
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
