/**
 * TypeScript types for AI Preset domain
 * Re-exported from Zod schemas for convenience
 *
 * Refactored for normalized Firestore design (data-model-v4)
 */

export type {
  // AI Preset Types (discriminated union members)
  PhotoAiPreset,
  VideoAiPreset,
  GifAiPreset,
  AiPreset,

  // Legacy aliases for backward compatibility
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
  AiPresetType,
  ExperienceType,
  PreviewType,
  AspectRatio,
  CameraFacing,

  // Creation/Update Types (new names)
  CreatePhotoAiPresetData,
  UpdatePhotoAiPresetData,
  CreateGifAiPresetData,
  UpdateGifAiPresetData,
  CreateVideoAiPresetData,
  UpdateVideoAiPresetData,

  // Creation/Update Types (legacy aliases)
  CreatePhotoExperienceData,
  UpdatePhotoExperienceData,
  CreateGifExperienceData,
  UpdateGifExperienceData,
  CreateVideoExperienceData,
  UpdateVideoExperienceData,

  // Type aliases
  AiPresetSchema,
  ExperienceSchema,
} from "../schemas";
