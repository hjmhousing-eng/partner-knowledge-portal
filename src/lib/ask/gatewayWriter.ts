import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";

/** Primary then fallback through AI Gateway (D11). Tools stay the same. */
export function askPrimaryModelId() {
  return process.env.ASK_MODEL ?? "openai/gpt-4.1-mini";
}

export function askFallbackModelId() {
  return process.env.ASK_FALLBACK_MODEL ?? "openai/gpt-4o-mini";
}

export function askPrimaryModel() {
  return gateway(askPrimaryModelId());
}

export function askFallbackModel() {
  return gateway(askFallbackModelId());
}

export async function generateWithGatewayFallback(input: {
  system: string;
  prompt: string;
}): Promise<string> {
  try {
    const primary = await generateText({
      model: askPrimaryModel(),
      system: input.system,
      prompt: input.prompt,
      // 429 on the free tier is not a blip; retries spend the remaining budget.
      maxRetries: 0,
    });
    return primary.text;
  } catch {
    try {
      const fallback = await generateText({
        model: askFallbackModel(),
        system: input.system,
        prompt: input.prompt,
        maxRetries: 0,
      });
      return fallback.text;
    } catch {
      throw new Error("gateway_unavailable");
    }
  }
}
