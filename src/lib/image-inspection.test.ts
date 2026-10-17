import { describe, expect, it } from "vitest";
import { clampImageDimensions, classifyQrPayload, imageFileLabel, isHttpUrl, MAX_IMAGE_BYTES, validateImageFile } from "./image-inspection";

describe("image inspection validation", () => {
  it("accepts supported image types within the size limit", () => {
    expect(validateImageFile({ name: "message.png", type: "image/png", size: 1024 } as File)).toBeUndefined();
    expect(validateImageFile({ name: "message.webp", type: "image/webp", size: MAX_IMAGE_BYTES } as File)).toBeUndefined();
  });

  it("rejects missing, unsupported, empty, and oversized files", () => {
    expect(validateImageFile(null)).toContain("Choose");
    expect(validateImageFile({ name: "message.pdf", type: "application/pdf", size: 20 } as File)).toContain("not supported");
    expect(validateImageFile({ name: "empty.png", type: "image/png", size: 0 } as File)).toContain("empty");
    expect(validateImageFile({ name: "large.png", type: "image/png", size: MAX_IMAGE_BYTES + 1 } as File)).toContain("8 MB");
  });

  it("classifies only HTTP and HTTPS QR payloads as URLs", () => {
    expect(isHttpUrl("https://example.com/path")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("plain text")).toBe(false);
    expect(classifyQrPayload("https://example.com/qr")).toEqual({ value: "https://example.com/qr", kind: "url" });
    expect(classifyQrPayload("  verify at desk  ")).toEqual({ value: "verify at desk", kind: "text" });
    expect(classifyQrPayload(" ")).toBeNull();
  });

  it("downscales large images predictably and labels files without retaining content", () => {
    expect(clampImageDimensions(4400, 2200)).toEqual({ width: 2200, height: 1100 });
    expect(imageFileLabel({ name: "capture.png", size: 1024 * 1024 } as File)).toBe("capture.png · 1.0 MB");
  });
});
