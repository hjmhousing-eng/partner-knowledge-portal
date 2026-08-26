import { describe, expect, it } from "vitest";
import { handleBoxDocumentWebhook } from "./handleBoxDocumentWebhook";
import type { DocumentCache, EventLog } from "./handleBoxDocumentWebhook";

function memoryEvents(): EventLog {
  const seen = new Set<string>();
  return {
    async alreadySeen(eventId) {
      return seen.has(eventId);
    },
    async markSeen(eventId) {
      seen.add(eventId);
    },
  };
}

function recordingCache(): DocumentCache & { fileIds: string[] } {
  const fileIds: string[] = [];
  return {
    fileIds,
    async revalidate(fileId) {
      fileIds.push(fileId);
    },
  };
}

describe("handleBoxDocumentWebhook", () => {
  it("ignores a webhook with an invalid signature and does not touch cache", async () => {
    const cache = recordingCache();

    const result = await handleBoxDocumentWebhook({
      signatureValid: false,
      eventId: "evt_1",
      fileId: "file_1",
      events: memoryEvents(),
      cache,
    });

    expect(result).toBe("ignored");
    expect(cache.fileIds).toEqual([]);
  });

  it("ignores a duplicate event id and does not revalidate again", async () => {
    const cache = recordingCache();
    const events = memoryEvents();
    const payload = {
      signatureValid: true as const,
      eventId: "evt_1",
      fileId: "file_1",
      events,
      cache,
    };

    await handleBoxDocumentWebhook(payload);
    const second = await handleBoxDocumentWebhook(payload);

    expect(second).toBe("ignored");
    expect(cache.fileIds).toEqual(["file_1"]);
  });

  it("revalidates only that file id after a new signed event", async () => {
    const cache = recordingCache();

    const result = await handleBoxDocumentWebhook({
      signatureValid: true,
      eventId: "evt_2",
      fileId: "file_99",
      events: memoryEvents(),
      cache,
    });

    expect(result).toBe("revalidated");
    expect(cache.fileIds).toEqual(["file_99"]);
  });
});
