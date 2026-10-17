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

  it("preserves each embedded URL occurrence for separate analysis", () => {
    expect(extractUrls("Review https://example.com/one and https://example.com/one again."))
      .toEqual(["https://example.com/one", "https://example.com/one"]);
  });

  it("separates adjacent HTTP and HTTPS links at punctuation", () => {
    expect(extractUrls("Links: http://one.example/a,https://two.example/b;"))
      .toEqual(["http://one.example/a", "https://two.example/b"]);
  });
});
