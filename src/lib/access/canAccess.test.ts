import { describe, expect, it } from "vitest";
import { canAccess } from "./canAccess";
import type { CollaborationLookup, FileId } from "./types";

function lookupFromAllowList(
  allowed: ReadonlySet<`${string}:${FileId}`>,
): CollaborationLookup {
  return {
    async hasAccess(boxUserId, fileId) {
      return allowed.has(`${boxUserId}:${fileId}`);
    },
  };
}

describe("canAccess", () => {
  it("denies an anonymous reader without consulting collaborations", async () => {
    const collaborations: CollaborationLookup = {
      async hasAccess() {
        throw new Error("anonymous readers have no Box identity");
      },
    };

    await expect(
      canAccess({ kind: "anonymous" }, "file_partner_battlecard", collaborations),
    ).resolves.toBe(false);
  });

  it("allows a Box user who is a collaborator on the file", async () => {
    const collaborations = lookupFromAllowList(new Set(["user_jane:file_1"]));

    await expect(
      canAccess(
        { kind: "boxUser", boxUserId: "user_jane" },
        "file_1",
        collaborations,
      ),
    ).resolves.toBe(true);
  });

  it("denies a Box user who is not a collaborator on the file", async () => {
    const collaborations = lookupFromAllowList(new Set(["user_jane:file_1"]));

    await expect(
      canAccess(
        { kind: "boxUser", boxUserId: "user_jane" },
        "file_2",
        collaborations,
      ),
    ).resolves.toBe(false);
  });
});
