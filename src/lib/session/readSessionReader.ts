import { cookies } from "next/headers";
import type { Reader } from "../access/types";
import { DEMO_BOX_USER_ID } from "../fixtures/demoLibrary";

export const READER_COOKIE = "portal_reader";

export async function readSessionReader(): Promise<Reader> {
  const jar = await cookies();
  const value = jar.get(READER_COOKIE)?.value;
  if (value === DEMO_BOX_USER_ID) {
    return { kind: "boxUser", boxUserId: DEMO_BOX_USER_ID };
  }
  return { kind: "anonymous" };
}
