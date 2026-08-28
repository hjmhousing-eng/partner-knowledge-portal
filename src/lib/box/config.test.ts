import { afterEach, describe, expect, it } from "vitest";
import { isBoxConfigured } from "./config";

const keys = [
  "BOX_CLIENT_ID",
  "BOX_CLIENT_SECRET",
  "BOX_ENTERPRISE_ID",
  "BOX_LIBRARY_FOLDER_ID",
] as const;

describe("isBoxConfigured", () => {
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      const value = snapshot[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("is false until CCG and library folder env are all set", () => {
    for (const key of keys) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
    expect(isBoxConfigured()).toBe(false);

    process.env.BOX_CLIENT_ID = "id";
    process.env.BOX_CLIENT_SECRET = "secret";
    process.env.BOX_ENTERPRISE_ID = "0";
    process.env.BOX_LIBRARY_FOLDER_ID = "123";
    expect(isBoxConfigured()).toBe(true);
  });
});
