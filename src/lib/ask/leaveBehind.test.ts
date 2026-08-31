import { describe, expect, it } from "vitest";
import { draftLeaveBehind } from "./leaveBehind";
import type { ArticleCatalog, CatalogEntry } from "../articles/loadArticlePage";
import type { CollaborationLookup } from "../access/types";

const publicSheet: CatalogEntry = {
  fileId: "file_pdf",
  slug: "sku-a/datasheet",
  audience: "public",
  title: "Pulse Controller datasheet",
  format: "pdf",
};

const partnerCard: CatalogEntry = {
  fileId: "file_1",
  slug: "sku-a/battlecard",
  audience: "partner",
  title: "Pulse Controller battlecard",
  format: "markdown",
};

const catalog: ArticleCatalog = {
  async bySlug() {
    return null;
  },
  async byFileId(fileId) {
    if (fileId === "file_pdf") {
      return publicSheet;
    }
    if (fileId === "file_1") {
      return partnerCard;
    }
    return null;
  },
  async list() {
    return [publicSheet, partnerCard];
  },
};

const janeOnly: CollaborationLookup = {
  async hasAccess(boxUserId, fileId) {
    return boxUserId === "user_jane" && fileId === "file_1";
  },
};

describe("draftLeaveBehind", () => {
  it("returns not_found for a missing or forbidden article", async () => {
    const missing = await draftLeaveBehind({
      reader: { kind: "anonymous" },
      fileId: "missing",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask() {
          throw new Error("must not call Box AI");
        },
      },
      compose: async () => {
        throw new Error("must not compose");
      },
    });
    expect(missing).toEqual({ status: "not_found" });

    const forbidden = await draftLeaveBehind({
      reader: { kind: "anonymous" },
      fileId: "file_1",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask() {
          throw new Error("must not call Box AI");
        },
      },
      compose: async () => {
        throw new Error("must not compose");
      },
    });
    expect(forbidden).toEqual({ status: "not_found" });
  });

  it("composes a public leave-behind via CCG Box AI", async () => {
    const result = await draftLeaveBehind({
      reader: { kind: "anonymous" },
      fileId: "file_pdf",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask({ fileIds, asUserId, question }) {
          expect(fileIds).toEqual(["file_pdf"]);
          expect(asUserId).toBeNull();
          expect(question).toContain("leave-behind");
          return "24 VAC controller for RTUs.";
        },
      },
      compose: async ({ notes, audience }) => {
        expect(notes).toContain("24 VAC");
        expect(audience).toBe("public");
        return "Share with the engineer: 24 VAC RTU controller.";
      },
    });

    expect(result).toEqual({
      status: "ok",
      title: "Pulse Controller datasheet",
      href: "/products/sku-a/datasheet",
      markdown: "Share with the engineer: 24 VAC RTU controller.",
    });
  });

  it("composes a partner leave-behind as-user when the gate allows", async () => {
    const result = await draftLeaveBehind({
      reader: { kind: "boxUser", boxUserId: "user_jane" },
      fileId: "file_1",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask({ asUserId }) {
          expect(asUserId).toBe("user_jane");
          return "Do not share multipliers. Lead with uptime.";
        },
      },
      compose: async ({ audience }) => {
        expect(audience).toBe("partner");
        return "Internal: lead with uptime. Do not share multipliers.";
      },
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.markdown).toContain("uptime");
    }
  });

  it("falls back to article markdown when Box AI has no answer", async () => {
    const result = await draftLeaveBehind({
      reader: { kind: "anonymous" },
      fileId: "file_pdf",
      catalog,
      collaborations: janeOnly,
      boxAi: {
        async ask() {
          return null;
        },
      },
      loadBody: async () => ({
        fileId: "file_pdf",
        title: "Pulse Controller datasheet",
        format: "markdown",
        markdown: "Input 24 VAC.",
      }),
      compose: async ({ notes }) => notes,
    });

    expect(result).toMatchObject({
      status: "ok",
      markdown: "Input 24 VAC.",
    });
  });
});
