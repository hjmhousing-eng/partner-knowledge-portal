import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { loadAskPassages, searchLibrary } from "@/lib/ask/searchLibrary";
import {
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
 */
export async function POST(request: Request) {
  const reader = await readSessionReader();
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: process.env.ASK_MODEL ?? "openai/gpt-4.1-mini",
    stopWhen: stepCountIs(6),
    system: `You answer from this partner knowledge portal only.
Use search_library then read_sources before claiming facts.
Cite only href values from tools (paths like /products/sku-a/overview). Never cite box.com.
If tools return no passages, say you do not have a source. Do not invent partner pricing.`,
    messages: await convertToModelMessages(messages),
    tools: {
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
      read_sources: tool({
        description:
          "Load article text for file ids from search_library. Skips files the reader cannot open.",
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
    },
  });

  return result.toUIMessageStreamResponse();
}
