import { describe, expect, it } from "vitest";
import {
  boxCatalog,
  boxCollaborations,
  boxDocumentStore,
  boxLibrarySearch,
} from "./adapters";
import type { BoxLibraryPort } from "./port";

const port: BoxLibraryPort = {
  async probeFileAsUser(boxUserId, fileId) {
    return boxUserId === "user_jane" && fileId === "file_1";
  },
  async loadArticle(fileId) {
    if (fileId !== "file_1") {
      return null;
    }
    return {
      fileId: "file_1",
      title: "SKU-A battlecard",
      format: "markdown",
      markdown: "Lead with reliability.",
    };
  },
  async listCatalog() {
    return [
      {
        fileId: "file_1",
        slug: "sku-a/battlecard",
        audience: "partner",
        title: "SKU-A battlecard",
        format: "markdown",
      },
    ];
  },
  async searchAsUser(boxUserId, query) {
    if (boxUserId !== "user_jane" || !query.toLowerCase().includes("sku")) {
      return [];
    }
    return ["file_1"];
  },
  async downloadPdf() {
    return null;
  },
  async askFiles() {
    return null;
  },
};

describe("boxCollaborations", () => {
  it("delegates the gate to an as-user probe", async () => {
    const collaborations = boxCollaborations(port);
    await expect(collaborations.hasAccess("user_jane", "file_1")).resolves.toBe(
      true,
    );
    await expect(collaborations.hasAccess("user_priya", "file_1")).resolves.toBe(
      false,
    );
  });
});

describe("boxDocumentStore", () => {
  it("loads article body by file id only", async () => {
    const store = boxDocumentStore(port);
    await expect(store.load("file_1")).resolves.toMatchObject({
      fileId: "file_1",
      markdown: "Lead with reliability.",
    });
  });
});

describe("boxCatalog", () => {
  it("resolves a slug from the Box library listing", async () => {
    const catalog = boxCatalog(port);
    await expect(catalog.bySlug("sku-a/battlecard")).resolves.toEqual({
      fileId: "file_1",
      slug: "sku-a/battlecard",
      audience: "partner",
      title: "SKU-A battlecard",
      format: "markdown",
    });
    await expect(catalog.bySlug("missing")).resolves.toBeNull();
    await expect(catalog.byFileId("file_1")).resolves.toMatchObject({
      slug: "sku-a/battlecard",
    });
    await expect(catalog.list()).resolves.toHaveLength(1);
  });
});

describe("boxLibrarySearch", () => {
  it("returns only as-user hits joined to catalog slugs", async () => {
    const search = boxLibrarySearch(port);
    await expect(
      search.searchAsUser("user_jane", "SKU"),
    ).resolves.toEqual([
      {
        fileId: "file_1",
        title: "SKU-A battlecard",
        slug: "sku-a/battlecard",
      },
    ]);
    await expect(search.searchAsUser("user_priya", "SKU")).resolves.toEqual([]);
  });
});
