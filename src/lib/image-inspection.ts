export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export function validateImageFile(file: Pick<File, "type" | "size" | "name"> | null | undefined): string | undefined {
  if (!file) return "Choose a PNG, JPEG, or WebP image first.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType)) {
    return "This file type is not supported. Choose a PNG, JPEG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "That image is larger than 8 MB. Choose a smaller screenshot or compress it before uploading.";
  }
  if (file.size === 0) return "This image is empty. Choose another file.";
  return undefined;
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type QrPayloadKind = "url" | "text";

export interface ClassifiedQrPayload {
  value: string;
  kind: QrPayloadKind;
}

export function classifyQrPayload(payload: string | null | undefined): ClassifiedQrPayload | null {
  const value = payload?.trim() ?? "";
  if (!value) return null;
  return { value, kind: isHttpUrl(value) ? "url" : "text" };
}

export function imageFileLabel(file: Pick<File, "name" | "size">): string {
  const megabytes = file.size / (1024 * 1024);
  return `${file.name} · ${megabytes < 1 ? `${Math.round(file.size / 1024)} KB` : `${megabytes.toFixed(1)} MB`}`;
}

export function clampImageDimensions(width: number, height: number, maxDimension = 2200): { width: number; height: number } {
  if (Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
