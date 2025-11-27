/**
 * Media validation configuration for step media uploads
 */
export const MEDIA_VALIDATION = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeLabel: "10MB",
  },
  gif: {
    mimeTypes: ["image/gif"],
    extensions: [".gif"],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeLabel: "10MB",
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm"],
    extensions: [".mp4", ".webm"],
    maxSize: 25 * 1024 * 1024, // 25MB
    maxSizeLabel: "25MB",
  },
  lottie: {
    mimeTypes: ["application/json"],
    extensions: [".json"],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeLabel: "5MB",
  },
} as const;

/**
 * All supported MIME types for step media
 */
export const SUPPORTED_MIME_TYPES = [
  ...MEDIA_VALIDATION.image.mimeTypes,
  ...MEDIA_VALIDATION.gif.mimeTypes,
  ...MEDIA_VALIDATION.video.mimeTypes,
  ...MEDIA_VALIDATION.lottie.mimeTypes,
];

/**
 * Accept string for file input element
 */
export const ACCEPT_STRING = SUPPORTED_MIME_TYPES.join(",");
