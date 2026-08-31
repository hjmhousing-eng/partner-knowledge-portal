import { BoxApiError } from "box-typescript-sdk-gen/lib/box/errors";

/** 404 not 403. BoxApiError often has a null responseInfo; the status is on the message. */
export function isAccessDenied(error: unknown): boolean {
  const status = statusFromBoxError(error);
  return status === 403 || status === 404;
}

function statusFromBoxError(error: unknown): number | undefined {
  if (error instanceof BoxApiError) {
    const fromInfo = error.responseInfo?.statusCode;
    if (typeof fromInfo === "number") {
      return fromInfo;
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  const match = /^(\d{3})\b/.exec(message);
  return match ? Number(match[1]) : undefined;
}
