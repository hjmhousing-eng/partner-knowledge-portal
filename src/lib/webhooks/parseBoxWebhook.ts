export type ParsedBoxWebhook = {
  eventId: string;
  fileId: string;
};

export function parseBoxWebhookPayload(raw: string): ParsedBoxWebhook | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null) {
    return null;
  }

  const rec = body as {
    id?: unknown;
    source?: { type?: unknown; id?: unknown };
  };

  if (typeof rec.id !== "string") {
    return null;
  }
  if (rec.source?.type !== "file" || typeof rec.source.id !== "string") {
    return null;
  }

  return { eventId: rec.id, fileId: rec.source.id };
}
