import { describe, expect, it } from "vitest";
import { getDocument } from "../documents/getDocument";
import { gateCatalogEntry, loadArticlePage } from "./loadArticlePage";
import type { ArticleCatalog, CatalogEntry } from "./loadArticlePage";
import type { ArticleBody, DocumentStore } from "../documents/getDocument";
import type { CollaborationLookup } from "../access/types";

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

const welcomeBody: ArticleBody = {
  fileId: "file_public",
  title: "Welcome",
  format: "markdown",
  markdown: "This page is public.",
};

const battlecardBody: ArticleBody = {
  fileId: "file_1",
  title: "SKU-A battlecard",
  format: "markdown",
  markdown: "Lead with reliability.",
};

function catalogFrom(entries: CatalogEntry[]): ArticleCatalog {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const byFileId = new Map(entries.map((entry) => [entry.fileId, entry]));
  return {
    async bySlug(slug) {
      return bySlug.get(slug) ?? null;
    },
    async byFileId(fileId) {
      return byFileId.get(fileId) ?? null;
    },
    async list() {
      return entries;
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

describe("gateCatalogEntry", () => {
  const publicPdf: CatalogEntry = {
    fileId: "file_pdf_public",
    slug: "sku-a/datasheet",
    audience: "public",
    title: "SKU-A · Datasheet",
    format: "pdf",
  };
  const partnerPdf: CatalogEntry = {
    fileId: "file_pdf_partner",
    slug: "sku-a/install-guide",
    audience: "partner",
    title: "SKU-A · Install Guide",
    format: "pdf",
  };
  const partnerPdfCollabs: CollaborationLookup = {
    async hasAccess(boxUserId, fileId) {
      return boxUserId === "user_jane" && fileId === "file_pdf_partner";
    },
  };

  it("allows a public PDF without a login", async () => {
    await expect(
      gateCatalogEntry({ kind: "anonymous" }, publicPdf, partnerPdfCollabs),
    ).resolves.toBe(true);
  });

  it("denies a partner PDF when the reader has no collaboration", async () => {
    await expect(
      gateCatalogEntry({ kind: "anonymous" }, partnerPdf, partnerPdfCollabs),
    ).resolves.toBe(false);
    await expect(
      gateCatalogEntry(
        { kind: "boxUser", boxUserId: "user_priya" },
        partnerPdf,
        partnerPdfCollabs,
      ),
    ).resolves.toBe(false);
  });

  it("allows a partner PDF when Box says the user can open the file", async () => {
    await expect(
      gateCatalogEntry(
        { kind: "boxUser", boxUserId: "user_jane" },
        partnerPdf,
        partnerPdfCollabs,
      ),
    ).resolves.toBe(true);
  });
});
