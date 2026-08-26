import { describe, expect, it } from "vitest";
import { citationHref, searchLibrary } from "./searchLibrary";
import type { LibraryHit, LibrarySearch } from "./searchLibrary";

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

  it("returns no hits for an anonymous reader without searching", async () => {
    const search: LibrarySearch = {
      async searchAsUser() {
        throw new Error("anonymous readers must not search Box");
      },
    };

    await expect(
      searchLibrary({ kind: "anonymous" }, "SKU-A", search),
    ).resolves.toEqual([]);
  });

  it("returns only hits the reader is allowed to see", async () => {
    const search = searchFromHits([janeBattlecard, priyaPricing]);

    const hits = await searchLibrary(
      { kind: "boxUser", boxUserId: "user_jane" },
      "SKU-A",
      search,
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
