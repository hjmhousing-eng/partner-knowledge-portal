import { WebhooksManager } from "box-typescript-sdk-gen/lib/managers/webhooks.generated";
import {
  memoryWebhookEvents,
  revalidateDocumentTag,
  revalidateLibraryTag,
} from "@/lib/box/runtime";
import { handleBoxDocumentWebhook } from "@/lib/webhooks/handleBoxDocumentWebhook";
import { parseBoxWebhookPayload } from "@/lib/webhooks/parseBoxWebhook";

export async function POST(request: Request) {
  const raw = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const key = process.env.BOX_WEBHOOK_SIGNATURE_KEY;
  const signatureValid = key
    ? await WebhooksManager.validateMessage(raw, headers, key)
    : false;

  const parsed = parseBoxWebhookPayload(raw);
  if (!parsed) {
    return Response.json({ status: "ignored" });
  }

  const status = await handleBoxDocumentWebhook({
    signatureValid,
    eventId: parsed.eventId,
    fileId: parsed.fileId,
    events: memoryWebhookEvents,
    cache: {
      async revalidate(fileId) {
        await revalidateDocumentTag(fileId);
        await revalidateLibraryTag();
      },
    },
  });

  return Response.json({ status });
}
