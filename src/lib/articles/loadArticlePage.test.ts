import { describe, expect, it } from "vitest";
import { getDocument } from "../documents/getDocument";
import { loadArticlePage } from "./loadArticlePage";
import type { ArticleCatalog, CatalogEntry } from "./loadArticlePage";
import type { ArticleBody, DocumentStore } from "../documents/getDocument";
import type { CollaborationLookup } from "../access/types";

const publicWelcome: CatalogEntry = {
  fileId: "file_public",
  slug: "welcome",
  audience: "public",
};

const partnerBattlecard: CatalogEntry = {
  fileId: "file_1",
  slug: "sku-a/battlecard",
  audience: "partner",
};

const welcomeBody: ArticleBody = {
  fileId: "file_public",
  title: "Welcome",
  markdown: "This page is public.",
};

const battlecardBody: ArticleBody = {
  fileId: "file_1",
  title: "SKU-A battlecard",
  markdown: "Lead with reliability.",
};

function catalogFrom(entries: CatalogEntry[]): ArticleCatalog {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  return {
    async bySlug(slug) {
      return bySlug.get(slug) ?? null;
    },
  };
}

function storeFrom(articles: ArticleBody[]): DocumentStore {
  const byId = new Map(articles.map((article) => [article.fileId, article]));
  return {
    async load(fileId) {
      return byId.get(fileId) ?? null;
    },
  };
}

const janeOnly: CollaborationLookup = {
  async hasAccess(boxUserId, fileId) {
    return boxUserId === "user_jane" && fileId === "file_1";
  },
};

function deps() {
  const store = storeFrom([welcomeBody, battlecardBody]);
  return {
    catalog: catalogFrom([publicWelcome, partnerBattlecard]),
    collaborations: janeOnly,
    loadBody: (fileId: string) => getDocument(fileId, store),
  };
}

describe("loadArticlePage", () => {
  it("returns not_found for an unknown slug", async () => {
    const result = await loadArticlePage({
      reader: { kind: "anonymous" },
      slug: "no-such-page",
      ...deps(),
    });

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns the public article without a login", async () => {
    const result = await loadArticlePage({
      reader: { kind: "anonymous" },
      slug: "welcome",
      ...deps(),
    });

    expect(result).toEqual({
      status: "ok",
      article: welcomeBody,
    });
  });

  it("returns not_found for a partner article when the reader is anonymous", async () => {
    const result = await loadArticlePage({
      reader: { kind: "anonymous" },
      slug: "sku-a/battlecard",
      ...deps(),
    });

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns not_found for a partner article the Box user cannot open", async () => {
    const result = await loadArticlePage({
      reader: { kind: "boxUser", boxUserId: "user_priya" },
      slug: "sku-a/battlecard",
      ...deps(),
    });

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns the partner article when the Box user can open the file", async () => {
    const result = await loadArticlePage({
      reader: { kind: "boxUser", boxUserId: "user_jane" },
      slug: "sku-a/battlecard",
      ...deps(),
    });

    expect(result).toEqual({
      status: "ok",
      article: battlecardBody,
    });
  });
});
