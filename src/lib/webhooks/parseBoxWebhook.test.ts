import { describe, expect, it } from "vitest";
import { parseBoxWebhookPayload } from "./parseBoxWebhook";

describe("parseBoxWebhookPayload", () => {
  it("extracts event id and file id from a Box file event", () => {
    expect(
      parseBoxWebhookPayload(
        JSON.stringify({
          id: "evt_1",
          source: { type: "file", id: "file_1" },
        }),
      ),
    ).toEqual({ eventId: "evt_1", fileId: "file_1" });
  });

  it("ignores folder events and malformed bodies", () => {
    expect(
      parseBoxWebhookPayload(
        JSON.stringify({ id: "evt_1", source: { type: "folder", id: "1" } }),
      ),
    ).toBeNull();
    expect(parseBoxWebhookPayload("not-json")).toBeNull();
  });
});
