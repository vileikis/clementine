// Experience feature constants

export const EXPERIENCE_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 200 },
  DESCRIPTION_LENGTH: { max: 1000 },
  MAX_STEPS: 50,
  PREVIEW_MEDIA: {
    URL_MAX_LENGTH: 2048,
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_MAX_SIZE_LABEL: "5MB",
    GIF_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    GIF_MAX_SIZE_LABEL: "10MB",
    SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
    SUPPORTED_GIF_TYPES: ["image/gif"],
  },
} as const;

export const DEFAULT_EXPERIENCE_NAME = "Untitled";
