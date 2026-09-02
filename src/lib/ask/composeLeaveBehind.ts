import { generateWithGatewayFallback } from "./gatewayWriter";
import type { Audience } from "../articles/loadArticlePage";

export async function composeLeaveBehind(input: {
  title: string;
  notes: string;
  audience: Audience;
}): Promise<string> {
  const confidential =
    input.audience === "partner"
      ? "This source is confidential to the distributor. Separate what an engineer may see from multipliers, competitive notes, and contract terms."
      : "This source is public literature. The whole brief may be shared with a consulting engineer.";

  try {
    return await generateWithGatewayFallback({
      system: `You write short partner leave-behinds for Helios Controls.
Use only the Box AI notes. Cite the site path if you mention a document.
Do not invent specs or pricing. ${confidential}
Markdown only. Headings: Share with the customer, Keep internal.`,
      prompt: `Document: ${input.title}\n\nBox AI notes:\n${input.notes}`,
    });
  } catch {
    // Primary and fallback both missed. Gated source notes remain safe to show.
    return `## Share with the customer

${confidential}

## Notes from the article

${input.notes}

## Keep internal

Drafted from ${input.title}. Claims above come from the source article; nothing else was added.`;
  }
}
