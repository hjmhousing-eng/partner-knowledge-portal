import type { CollaborationLookup } from "../access/types";
import type { ArticleCatalog, CatalogEntry } from "../articles/loadArticlePage";
import type { ArticleBody, DocumentStore } from "../documents/getDocument";

const entries: CatalogEntry[] = [
  {
    fileId: "file_public",
    slug: "welcome",
    audience: "public",
  },
  {
    fileId: "file_1",
    slug: "sku-a/battlecard",
    audience: "partner",
  },
];

const articles: ArticleBody[] = [
  {
    fileId: "file_public",
    title: "Welcome",
    markdown:
      "This page is public. The SKU-A battlecard is partner-only and 404s until you log in.",
  },
  {
    fileId: "file_1",
    title: "SKU-A battlecard",
    markdown:
      "Lead with reliability. Cite this page from ask-the-library as /products/sku-a/battlecard.",
  },
];

export const DEMO_BOX_USER_ID = "user_jane";

export const fixtureCatalog: ArticleCatalog = {
  async bySlug(slug) {
    return entries.find((entry) => entry.slug === slug) ?? null;
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
