/**
 * TypeScript types for Experience domain
 * Re-exported from Zod schemas for convenience
 *
 * Refactored for normalized Firestore design (data-model-v4)
 */

export type {
  // Experience Types (discriminated union members)
  PhotoExperience,
  VideoExperience,
  GifExperience,
  Experience,

  // Capture Config Types (renamed from PhotoConfig, etc.)
  PhotoCaptureConfig,
  VideoCaptureConfig,
  GifCaptureConfig,

  // AI Config Types (type-specific)
  AiPhotoConfig,
  AiVideoConfig,

  // Primitive Types
  ExperienceType,
  PreviewType,
  AspectRatio,
  CameraFacing,

  // Creation/Update Types
  CreatePhotoExperienceData,
  UpdatePhotoExperienceData,
  CreateGifExperienceData,
  UpdateGifExperienceData,
  CreateVideoExperienceData,
  UpdateVideoExperienceData,

  // Type alias
  ExperienceSchema,
} from "../schemas";
