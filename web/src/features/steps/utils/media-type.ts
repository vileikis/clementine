import type { StepMediaType } from "../types";

/**
 * Detect media type from file MIME type
 *
 * @param file - File to detect type from
 * @returns Media type or null if unsupported
 */
export function detectMediaType(file: File): StepMediaType | null {
  // Images (not GIF)
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "image";
  }
  // GIF
  if (file.type === "image/gif") {
    return "gif";
  }
  // Video
  if (["video/mp4", "video/webm"].includes(file.type)) {
    return "video";
  }
  // JSON (potential Lottie - requires validation)
  if (file.type === "application/json" || file.name.endsWith(".json")) {
    return "lottie";
  }
  return null;
}

/**
 * Infer media type from URL extension (backward compatibility)
 *
 * @param url - URL to infer type from
 * @returns Media type (defaults to "image" if unknown)
 */
export function inferMediaTypeFromUrl(url: string): StepMediaType {
  const ext = url.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) return "image";
  if (ext === "gif") return "gif";
  if (["mp4", "webm"].includes(ext ?? "")) return "video";
  if (ext === "json") return "lottie";

  return "image"; // Safe default
}

/**
 * Get media type, using stored value or inferring from URL
 *
 * @param mediaType - Stored media type (may be null for legacy steps)
 * @param mediaUrl - Media URL (used for inference when mediaType is null)
 * @returns Media type or null if no media
 */
export function getMediaType(
  mediaType: StepMediaType | null | undefined,
  mediaUrl: string | null | undefined
): StepMediaType | null {
  if (mediaType) return mediaType;
  if (mediaUrl) return inferMediaTypeFromUrl(mediaUrl);
  return null;
}
