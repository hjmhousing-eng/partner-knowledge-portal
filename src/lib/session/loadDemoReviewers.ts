import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_BOX_USER_ID } from "../fixtures/demoLibrary";
import {
  parseDemoReviewersJson,
  type DemoReviewer,
} from "./demoReviewers";

const REVIEWERS_FILE = "demo-reviewers.json";

function legacyReviewer(): DemoReviewer {
  return {
    email: process.env.DEMO_PARTNER_EMAIL ?? "partner@example.com",
    password: process.env.DEMO_PARTNER_PASSWORD ?? "partner",
    boxUserId: process.env.BOX_DEMO_PARTNER_USER_ID ?? DEMO_BOX_USER_ID,
  };
}

function reviewersFromFile(): DemoReviewer[] | null {
  const path = join(process.cwd(), REVIEWERS_FILE);
  if (!existsSync(path)) {
    return null;
  }
  return parseDemoReviewersJson(readFileSync(path, "utf8"));
}

/**
 * Demo logins only. Each row is a site password that maps to a Box App User
 * id for As-User. Cookie values must come from this list.
 */
export function loadDemoReviewers(): DemoReviewer[] {
  const fromEnv = process.env.DEMO_REVIEWERS
    ? parseDemoReviewersJson(process.env.DEMO_REVIEWERS)
    : null;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  const fromFile = reviewersFromFile();
  if (fromFile && fromFile.length > 0) {
    return fromFile;
  }

  return [legacyReviewer()];
}
