import { describe, expect, it } from "vitest";
import { getDocument, type DocumentStore } from "./getDocument";
import type { ArticleBody } from "./getDocument";

function storeFromArticles(
  articles: readonly ArticleBody[],
): DocumentStore {
  const byId = new Map(articles.map((article) => [article.fileId, article]));
  return {
    async load(fileId) {
      return byId.get(fileId) ?? null;
    },
  };
}

describe("getDocument", () => {
  const battlecard: ArticleBody = {
    fileId: "file_1",
    title: "SKU-A battlecard",
    format: "markdown",
    markdown: "Lead with reliability.",
  };

  it("returns the article body for a file id with no reader argument", async () => {
    const store = storeFromArticles([battlecard]);

    await expect(getDocument("file_1", store)).resolves.toEqual(battlecard);
  });

  it("returns null when the library has no article for that file id", async () => {
    const store = storeFromArticles([battlecard]);

    await expect(getDocument("file_missing", store)).resolves.toBeNull();
  });

  it("returns the same body for the same file id regardless of who already passed the gate", async () => {
    const store = storeFromArticles([battlecard]);

    const first = await getDocument("file_1", store);
    const second = await getDocument("file_1", store);

    expect(first).toEqual(second);
    expect(first).toEqual(battlecard);
  });
});
