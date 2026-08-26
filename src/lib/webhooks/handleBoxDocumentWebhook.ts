import type { FileId } from "../access/types";

export type EventLog = {
  alreadySeen(eventId: string): Promise<boolean>;
  markSeen(eventId: string): Promise<void>;
};

/** Next.js revalidateTag lives behind this adapter. */
export type DocumentCache = {
  revalidate(fileId: FileId): Promise<void>;
};

export type BoxDocumentWebhookInput = {
  signatureValid: boolean;
  eventId: string;
  fileId: FileId;
  events: EventLog;
  cache: DocumentCache;
};

export type WebhookResult = "ignored" | "revalidated";

/**
 * Sequence 2: Box doorbell. HMAC belongs in the route; this module is the policy.
 */
export async function handleBoxDocumentWebhook(
  input: BoxDocumentWebhookInput,
): Promise<WebhookResult> {
  if (!input.signatureValid) {
    return "ignored";
  }

  if (await input.events.alreadySeen(input.eventId)) {
    return "ignored";
  }

  await input.events.markSeen(input.eventId);
  await input.cache.revalidate(input.fileId);
  return "revalidated";
}
