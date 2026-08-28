import { cookies } from "next/headers";
import type { Reader } from "../access/types";
import { isKnownDemoBoxUserId } from "./demoReviewers";
import { loadDemoReviewers } from "./loadDemoReviewers";

export const READER_COOKIE = "portal_reader";

export async function readSessionReader(): Promise<Reader> {
  const jar = await cookies();
  const value = jar.get(READER_COOKIE)?.value;
  if (value && isKnownDemoBoxUserId(value, loadDemoReviewers())) {
    return { kind: "boxUser", boxUserId: value };
  }
  return { kind: "anonymous" };
}
