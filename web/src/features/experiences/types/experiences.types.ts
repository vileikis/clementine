/**
 * TypeScript types for Experience domain
 * Re-exported from Zod schemas for convenience
 */

export type {
  // Experience Types (discriminated union members)
  PhotoExperience,
  VideoExperience,
  GifExperience,
  WheelExperience,
  Experience,

  // Config Types
  PhotoConfig,
  VideoConfig,
  GifConfig,
  WheelConfig,
  AiConfig,
  WheelItem,

  // Primitive Types
  ExperienceType,
  PreviewType,
  AspectRatio,

  // Creation/Update Types
  CreatePhotoExperienceData,
  UpdatePhotoExperienceData,
  CreateGifExperienceData,
  UpdateGifExperienceData,

  // Type alias
  ExperienceSchema,
} from "../schemas";
