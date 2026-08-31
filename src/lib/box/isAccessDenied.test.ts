import { describe, expect, it } from "vitest";
import { isAccessDenied } from "./isAccessDenied";

describe("isAccessDenied", () => {
  it("treats a Box 404 message as deny, not a throw", () => {
    expect(
      isAccessDenied(new Error('404 "Not Found"; Request ID: "abc"')),
    ).toBe(true);
    expect(isAccessDenied(new Error("403 Forbidden"))).toBe(true);
  });

  it("does not treat other failures as deny", () => {
    expect(isAccessDenied(new Error("500 Internal Server Error"))).toBe(false);
    expect(isAccessDenied(new Error("network down"))).toBe(false);
  });
});
