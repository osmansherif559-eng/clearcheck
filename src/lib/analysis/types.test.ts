import { describe, expect, it } from "vitest";
import { extractUrls, normalizeForMatching } from "./helpers";

describe("analysis helpers", () => {
  it("normalizes unicode and whitespace only for matching", () => {
    expect(normalizeForMatching("  Pay\u00a0now\n  ")).toBe("Pay now");
  });

  it("extracts URLs without trailing sentence punctuation", () => {
    expect(extractUrls("Visit https://example.com/path. Then use www.example.org!"))
      .toEqual(["https://example.com/path", "www.example.org"]);
  });
});
