import type { CollaborationLookup } from "../access/types";
import type { ArticleCatalog, CatalogEntry } from "../articles/loadArticlePage";
import type { LibrarySearch } from "../ask/searchLibrary";
import type { ArticleBody, DocumentStore } from "../documents/getDocument";

const entries: CatalogEntry[] = [
  {
    fileId: "file_public",
    slug: "welcome",
    audience: "public",
    title: "Welcome",
    format: "markdown",
  },
  {
    fileId: "file_1",
    slug: "sku-a/battlecard",
    audience: "partner",
    title: "SKU-A battlecard",
    format: "markdown",
  },
];

const articles: ArticleBody[] = [
  {
    fileId: "file_public",
    title: "Welcome",
    format: "markdown",
    markdown:
      "This page is public. The SKU-A battlecard is partner-only and 404s until you log in.",
  },
  {
    fileId: "file_1",
    title: "SKU-A battlecard",
    format: "markdown",
    markdown:
      "Lead with reliability. Cite this page from ask-the-library as /products/sku-a/battlecard.",
  },
];

export const DEMO_BOX_USER_ID = "user_jane";

export const fixtureCatalog: ArticleCatalog = {
  async bySlug(slug) {
    return entries.find((entry) => entry.slug === slug) ?? null;
  },
  async byFileId(fileId) {
    return entries.find((entry) => entry.fileId === fileId) ?? null;
  },
  async list() {
    return entries;
  },
};

export const fixtureStore: DocumentStore = {
  async load(fileId) {
    return articles.find((article) => article.fileId === fileId) ?? null;
  },
};

export const fixtureCollaborations: CollaborationLookup = {
  async hasAccess(boxUserId, fileId) {
    return boxUserId === DEMO_BOX_USER_ID && fileId === "file_1";
  },
};

export const fixturePublicSearch = {
  async searchPublic(query: string) {
    const needle = query.toLowerCase();
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

export const fixtureSearch: LibrarySearch = {
  async searchAsUser(boxUserId, query) {
    if (boxUserId !== DEMO_BOX_USER_ID) {
      return [];
    }
    const needle = query.toLowerCase();
    return entries
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(needle) ||
          entry.slug.toLowerCase().includes(needle),
      )
      .map((entry) => ({
        fileId: entry.fileId,
        title: entry.title,
        slug: entry.slug,
      }));
  },
};
