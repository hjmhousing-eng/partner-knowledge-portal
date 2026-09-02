import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import {
  gatewayClientError,
  askGatewayOptions,
  askPrimaryModel,
  logGatewayError,
} from "@/lib/ask/gatewayWriter";
import {
  AskRetrievalError,
  retrieveAskContext,
  type AskPageScope,
} from "@/lib/ask/searchLibrary";
import {
  portalBoxAi,
  portalCatalog,
  portalCollaborations,
  portalPublicSearch,
  portalSearch,
  portalStore,
} from "@/lib/box/runtime";
import { readSessionReader } from "@/lib/session/readSessionReader";

export const maxDuration = 30;

/**
 * Ask is per-reader and per-turn. Do not put use cache on this route.
 * Writer goes through Gateway; retrieval is Box AI after the gate (D10/D11).
 */
export async function POST(request: Request) {
  const reader = await readSessionReader();
  let messages: UIMessage[];
  let currentPageFileId: string | undefined;
  let currentPageScope: AskPageScope | undefined;
  try {
    const body = (await request.json()) as {
      messages: UIMessage[];
      currentPage?: unknown;
    };
    messages = body.messages;
    if (
      typeof body.currentPage === "object" &&
      body.currentPage !== null &&
      "fileId" in body.currentPage &&
      typeof body.currentPage.fileId === "string" &&
      body.currentPage.fileId.length <= 128
    ) {
      currentPageFileId = body.currentPage.fileId;
      currentPageScope =
        "scope" in body.currentPage && body.currentPage.scope === "page"
          ? "page"
          : "hint";
    }
  } catch {
    return new Response("invalid_request", { status: 400 });
  }
  const modelMessages = await convertToModelMessages(messages);
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const question =
    latestUserMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? "";

  let context: Awaited<ReturnType<typeof retrieveAskContext>> = null;
  try {
    context = question
      ? await retrieveAskContext({
          reader,
          question,
          currentPageFileId,
          currentPageScope,
          search: {
            asUser: portalSearch(),
            public: portalPublicSearch(),
          },
          catalog: portalCatalog(),
          collaborations: portalCollaborations(),
          boxAi: portalBoxAi(),
          store: portalStore(),
        })
      : null;
  } catch (error) {
    const retrieval =
      error instanceof AskRetrievalError
        ? {
            stage: error.stage,
            statusCode: error.statusCode,
          }
        : { stage: "unknown" };
    console.error(`Ask retrieval failed: ${JSON.stringify(retrieval)}`);
    return new Response(`retrieval_${retrieval.stage}_unavailable`, {
      status: 502,
    });
  }

  const system = `You answer from this partner knowledge portal only.
Use only the retrieved notes below. Cite only listed href values, never box.com.
If there are no notes or sources, say you do not have an accessible source.
Do not invent specifications, pricing, or access to an unlisted article.

Retrieved notes:
${context?.notes ?? "No accessible source found."}

Sources:
${JSON.stringify(context?.sources ?? [])}`;

  const result = streamText({
    model: askPrimaryModel(),
    providerOptions: askGatewayOptions(),
    system,
    messages: modelMessages,
    maxRetries: 0,
    onError: ({ error }) => logGatewayError(error),
  });

  return result.toUIMessageStreamResponse({
    onError: gatewayClientError,
  });
}
