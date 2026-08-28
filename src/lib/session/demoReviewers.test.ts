import { describe, expect, it } from "vitest";
import {
  authenticateDemoReviewer,
  isKnownDemoBoxUserId,
  parseDemoReviewersJson,
} from "./demoReviewers";

const alex = {
  email: "alex@example.com",
  password: "review-alex",
  boxUserId: "111",
};
const sam = {
  email: "sam@example.com",
  password: "review-sam",
  boxUserId: "222",
};

describe("parseDemoReviewersJson", () => {
  it("reads email, password, and Box user id rows", () => {
    expect(parseDemoReviewersJson(JSON.stringify([alex, sam]))).toEqual([
      alex,
      sam,
    ]);
  });

  it("rejects malformed lists", () => {
    expect(parseDemoReviewersJson("{")).toBeNull();
    expect(parseDemoReviewersJson(JSON.stringify({ email: "x" }))).toBeNull();
    expect(
      parseDemoReviewersJson(JSON.stringify([{ email: "x", password: "p" }])),
    ).toBeNull();
  });
});

describe("authenticateDemoReviewer", () => {
  it("maps a matching email to that row's Box user id", () => {
    expect(
      authenticateDemoReviewer("Alex@example.com", "review-alex", [alex, sam]),
    ).toEqual(alex);
    expect(
      authenticateDemoReviewer("sam@example.com", "wrong", [alex, sam]),
    ).toBeNull();
  });
});

describe("isKnownDemoBoxUserId", () => {
  it("allowlists cookie values so a forged id is not treated as signed in", () => {
    expect(isKnownDemoBoxUserId("222", [alex, sam])).toBe(true);
    expect(isKnownDemoBoxUserId("999", [alex, sam])).toBe(false);
  });
});
