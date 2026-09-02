import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";

/** Primary then fallback through AI Gateway (D11). Tools stay the same. */
export function askPrimaryModelId() {
  return process.env.ASK_MODEL ?? "openai/gpt-4.1-mini";
}

export function askFallbackModelId() {
  return process.env.ASK_FALLBACK_MODEL ?? "google/gemini-2.5-flash";
}

export function askPrimaryModel() {
  return gateway(askPrimaryModelId());
}

export function askFallbackModel() {
  return gateway(askFallbackModelId());
}

export function askGatewayOptions() {
  return {
    gateway: {
      models: [askFallbackModelId()],
    },
  };
}

function gatewayErrorField(error: unknown, field: string): unknown {
  try {
    return typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)[field]
      : undefined;
  } catch {
    return undefined;
  }
}

export function gatewayClientError(error: unknown): string {
  const name = String(gatewayErrorField(error, "name") ?? "");
  const statusCode = Number(gatewayErrorField(error, "statusCode"));
  return statusCode === 429 || name.includes("RateLimit")
    ? "gateway_rate_limited"
    : "gateway_unavailable";
}

export function logGatewayError(error: unknown) {
  console.error(
    `AI Gateway request failed: ${JSON.stringify({
      name: gatewayErrorField(error, "name"),
      code: gatewayErrorField(error, "code"),
      statusCode: gatewayErrorField(error, "statusCode"),
      isRetryable: gatewayErrorField(error, "isRetryable"),
    })}`,
  );
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
      providerOptions: askGatewayOptions(),
      maxRetries: 0,
    });
    return primary.text;
  } catch (error) {
    logGatewayError(error);
    throw new Error("gateway_unavailable");
  }
}
