import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { askFallbackModel, askPrimaryModel } from "@/lib/ask/gatewayWriter";
import {
  askBoxAiSources,
  loadAskPassages,
  searchLibrary,
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
  const { messages }: { messages: UIMessage[] } = await request.json();
  const modelMessages = await convertToModelMessages(messages);

  const tools = {
    search_library: tool({
      description:
        "Search articles this reader may see. Anonymous gets public pages only.",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
      execute: async ({ query }) => {
        return searchLibrary(reader, query, {
          asUser: portalSearch(),
          public: portalPublicSearch(),
        });
      },
    }),
    ask_box_ai: tool({
      description:
        "Ask Box AI about file ids from search_library. Skips files the reader cannot open. Works on PDFs.",
      inputSchema: z.object({
        fileIds: z.array(z.string()).min(1),
        question: z.string().min(1),
      }),
      execute: async ({ fileIds, question }) => {
        return askBoxAiSources({
          reader,
          fileIds,
          question,
          catalog: portalCatalog(),
          collaborations: portalCollaborations(),
          boxAi: portalBoxAi(),
        });
      },
    }),
    read_sources: tool({
      description:
        "Fallback: load markdown for file ids when Box AI has no answer. Skips PDFs and files the reader cannot open.",
      inputSchema: z.object({
        fileIds: z.array(z.string()).min(1),
      }),
      execute: async ({ fileIds }) => {
        return loadAskPassages({
          reader,
          fileIds,
          catalog: portalCatalog(),
          collaborations: portalCollaborations(),
          store: portalStore(),
        });
      },
    }),
  };

  const system = `You answer from this partner knowledge portal only.
Use search_library, then ask_box_ai on the returned file ids.
If Box AI has no answer, call read_sources.
Cite only href values from tools (paths like /products/sku-a/overview). Never cite box.com.
If tools return no sources, say you do not have a source. Do not invent partner pricing.`;

  let result;
  try {
    result = streamText({
      model: askPrimaryModel(),
      stopWhen: stepCountIs(6),
      system,
      messages: modelMessages,
      tools,
      maxRetries: 0,
    });
  } catch {
    result = streamText({
      model: askFallbackModel(),
      stopWhen: stepCountIs(6),
      system,
      messages: modelMessages,
      tools,
      maxRetries: 0,
    });
  }

  return result.toUIMessageStreamResponse();
}
