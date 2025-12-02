// Zod schemas for AI Preset data models using discriminated unions
// Refactored for normalized Firestore design (data-model-v4)
import { z } from "zod";

// ============================================================================
// Enums and Primitive Schemas
// ============================================================================

export const aiPresetTypeSchema = z.enum(["photo", "video", "gif"]);
/** @deprecated Use aiPresetTypeSchema instead */
export const experienceTypeSchema = aiPresetTypeSchema;

export const previewTypeSchema = z.enum(["image", "gif", "video"]);

export const aspectRatioSchema = z.enum([
  "1:1",
  "3:4",
  "4:5",
  "9:16",
  "16:9",
]);

export const cameraFacingSchema = z.enum(["front", "back", "both"]);

// ============================================================================
// Base AI Preset Schema (Shared Fields)
// ============================================================================

const baseAiPresetSchema = z.object({
  id: z.string(),
  companyId: z.string(), // Company that owns this AI preset
  eventIds: z.array(z.string()), // Events using this AI preset (many-to-many)

  // Core Configuration
  name: z.string().min(1).max(50), // Renamed from 'label'
  type: aiPresetTypeSchema,
  enabled: z.boolean(),
  // 'hidden' field removed

  // Preview Media (optional, nullable for graceful handling)
  previewMediaUrl: z.string().url().nullable().optional(), // Renamed from 'previewPath'
  previewType: previewTypeSchema.nullable().optional(),

  // Input Fields (deferred implementation)
  inputFields: z.array(z.unknown()).nullable().optional(),

  // Audit
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// ============================================================================
// Type-Specific Configuration Schemas
// ============================================================================

// Photo Capture Configuration (renamed from photoConfigSchema)
const photoCaptureConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10), // 0 = disabled, 1-10 = seconds
  cameraFacing: cameraFacingSchema,
  overlayUrl: z.string().url().nullable().optional(), // Renamed from overlayFramePath
});

// Video Capture Configuration
const videoCaptureConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10),
  cameraFacing: cameraFacingSchema,
  minDuration: z.number().int().min(1).optional(),
  maxDuration: z.number().int().min(1).max(60),
});

// GIF Capture Configuration
const gifCaptureConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10),
  cameraFacing: cameraFacingSchema,
  frameCount: z.number().int().min(3).max(10),
});

// ============================================================================
// AI Configuration Schemas (Type-Specific)
// ============================================================================

// AI Photo Configuration (for photo and gif types - they use image models)
const aiPhotoConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().nullable().optional(), // e.g., "flux", "stable-diffusion-xl"
  prompt: z.string().max(1000).nullable().optional(),
  referenceImageUrls: z.array(z.string().url()).max(5).nullable().optional(), // Renamed from referenceImagePaths
  aspectRatio: aspectRatioSchema.optional(),
});

// AI Video Configuration (for video type only - has additional fields)
const aiVideoConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().nullable().optional(), // e.g., "kling-video", "runway"
  prompt: z.string().max(1000).nullable().optional(),
  referenceImageUrls: z.array(z.string().url()).max(5).nullable().optional(),
  aspectRatio: aspectRatioSchema.optional(),
  duration: z.number().int().min(1).max(60).nullable().optional(), // Output duration in seconds
  fps: z.number().int().min(12).max(60).nullable().optional(), // Frames per second
});


// ============================================================================
// Discriminated Union AI Preset Schemas
// ============================================================================

export const photoAiPresetSchema = baseAiPresetSchema.extend({
  type: z.literal("photo"),
  captureConfig: photoCaptureConfigSchema, // Renamed from 'config'
  aiPhotoConfig: aiPhotoConfigSchema, // Renamed from 'aiConfig'
});

export const videoAiPresetSchema = baseAiPresetSchema.extend({
  type: z.literal("video"),
  captureConfig: videoCaptureConfigSchema,
  aiVideoConfig: aiVideoConfigSchema, // Video uses video-specific AI config
});

export const gifAiPresetSchema = baseAiPresetSchema.extend({
  type: z.literal("gif"),
  captureConfig: gifCaptureConfigSchema,
  aiPhotoConfig: aiPhotoConfigSchema, // GIF uses photo AI config (image models)
});

// Wheel experience type removed - not in scope for data-model-v4

// Discriminated Union - all AI preset types
export const aiPresetSchema = z.discriminatedUnion("type", [
  photoAiPresetSchema,
  videoAiPresetSchema,
  gifAiPresetSchema,
]);

// Legacy aliases for backward compatibility
/** @deprecated Use photoAiPresetSchema instead */
export const photoExperienceSchema = photoAiPresetSchema;
/** @deprecated Use videoAiPresetSchema instead */
export const videoExperienceSchema = videoAiPresetSchema;
/** @deprecated Use gifAiPresetSchema instead */
export const gifExperienceSchema = gifAiPresetSchema;
/** @deprecated Use aiPresetSchema instead */
export const experienceSchema = aiPresetSchema;

// ============================================================================
// Creation/Update Schemas
// ============================================================================

// Create Photo AI Preset
export const createPhotoAiPresetSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  eventIds: z.array(z.string()).default([]), // Can be empty initially
  name: z
    .string()
    .trim()
    .min(1, "AI preset name is required")
    .max(50, "AI preset name must be 50 characters or less"),
  type: z.literal("photo"),
});

// Update Photo AI Preset (partial updates allowed)
export const updatePhotoAiPresetSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    enabled: z.boolean().optional(),
    eventIds: z.array(z.string()).optional(), // Can modify event associations
    previewMediaUrl: z.string().url().nullable().optional(),
    previewType: previewTypeSchema.nullable().optional(),
    captureConfig: photoCaptureConfigSchema.partial().optional(),
    aiPhotoConfig: aiPhotoConfigSchema.partial().optional(),
  })
  .strict();

// Create GIF AI Preset
export const createGifAiPresetSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  eventIds: z.array(z.string()).default([]),
  name: z
    .string()
    .trim()
    .min(1, "AI preset name is required")
    .max(50, "AI preset name must be 50 characters or less"),
  type: z.literal("gif"),
});

// Update GIF AI Preset (partial updates allowed)
export const updateGifAiPresetSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    enabled: z.boolean().optional(),
    eventIds: z.array(z.string()).optional(),
    previewMediaUrl: z.string().url().nullable().optional(),
    previewType: previewTypeSchema.nullable().optional(),
    captureConfig: gifCaptureConfigSchema.partial().optional(),
    aiPhotoConfig: aiPhotoConfigSchema.partial().optional(),
  })
  .strict();

// Create Video AI Preset
export const createVideoAiPresetSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  eventIds: z.array(z.string()).default([]),
  name: z
    .string()
    .trim()
    .min(1, "AI preset name is required")
    .max(50, "AI preset name must be 50 characters or less"),
  type: z.literal("video"),
});

// Update Video AI Preset (partial updates allowed)
export const updateVideoAiPresetSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    enabled: z.boolean().optional(),
    eventIds: z.array(z.string()).optional(),
    previewMediaUrl: z.string().url().nullable().optional(),
    previewType: previewTypeSchema.nullable().optional(),
    captureConfig: videoCaptureConfigSchema.partial().optional(),
    aiVideoConfig: aiVideoConfigSchema.partial().optional(),
  })
  .strict();

// Legacy aliases for backward compatibility
/** @deprecated Use createPhotoAiPresetSchema instead */
export const createPhotoExperienceSchema = createPhotoAiPresetSchema;
/** @deprecated Use updatePhotoAiPresetSchema instead */
export const updatePhotoExperienceSchema = updatePhotoAiPresetSchema;
/** @deprecated Use createGifAiPresetSchema instead */
export const createGifExperienceSchema = createGifAiPresetSchema;
/** @deprecated Use updateGifAiPresetSchema instead */
export const updateGifExperienceSchema = updateGifAiPresetSchema;
/** @deprecated Use createVideoAiPresetSchema instead */
export const createVideoExperienceSchema = createVideoAiPresetSchema;
/** @deprecated Use updateVideoAiPresetSchema instead */
export const updateVideoExperienceSchema = updateVideoAiPresetSchema;

// ============================================================================
// Preview Media Upload Schemas
// ============================================================================

export const uploadPreviewMediaSchema = z.object({
  file: z.instanceof(File),
  fileType: z.enum(["image", "gif", "video"]),
  maxSizeBytes: z.number().default(10 * 1024 * 1024), // 10MB default
});

export const previewMediaResultSchema = z.object({
  publicUrl: z.string().url(),
  fileType: previewTypeSchema,
  sizeBytes: z.number(),
});

// ============================================================================
// AI Playground Schemas
// ============================================================================

/**
 * Input schema for playground preview generation.
 * Used by the generatePlaygroundPreview Server Action.
 */
export const playgroundGenerateInputSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  testImageBase64: z
    .string()
    .min(1, "Test image is required")
    .refine(
      (val) => val.startsWith("data:image/"),
      "Test image must be a valid data URL"
    ),
});

/**
 * Output schema for playground preview generation.
 * Returns the transformed image as a base64 data URL.
 */
export const playgroundGenerateOutputSchema = z.object({
  resultImageBase64: z.string(),
  generationTimeMs: z.number().optional(),
});

// ============================================================================
// TypeScript Type Exports
// ============================================================================

// AI Preset Types (discriminated union members)
export type PhotoAiPreset = z.infer<typeof photoAiPresetSchema>;
export type VideoAiPreset = z.infer<typeof videoAiPresetSchema>;
export type GifAiPreset = z.infer<typeof gifAiPresetSchema>;

export type AiPreset = z.infer<typeof aiPresetSchema>;

// Legacy aliases for backward compatibility
/** @deprecated Use PhotoAiPreset instead */
export type PhotoExperience = PhotoAiPreset;
/** @deprecated Use VideoAiPreset instead */
export type VideoExperience = VideoAiPreset;
/** @deprecated Use GifAiPreset instead */
export type GifExperience = GifAiPreset;
/** @deprecated Use AiPreset instead */
export type Experience = AiPreset;

// Capture Config Types (renamed from PhotoConfig, etc.)
export type PhotoCaptureConfig = z.infer<typeof photoCaptureConfigSchema>;
export type VideoCaptureConfig = z.infer<typeof videoCaptureConfigSchema>;
export type GifCaptureConfig = z.infer<typeof gifCaptureConfigSchema>;

// AI Config Types (type-specific)
export type AiPhotoConfig = z.infer<typeof aiPhotoConfigSchema>;
export type AiVideoConfig = z.infer<typeof aiVideoConfigSchema>;

// Primitive Types
export type AiPresetType = z.infer<typeof aiPresetTypeSchema>;
/** @deprecated Use AiPresetType instead */
export type ExperienceType = AiPresetType;
export type PreviewType = z.infer<typeof previewTypeSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type CameraFacing = z.infer<typeof cameraFacingSchema>;

// Creation/Update Types
export type CreatePhotoAiPresetData = z.infer<typeof createPhotoAiPresetSchema>;
export type UpdatePhotoAiPresetData = z.infer<typeof updatePhotoAiPresetSchema>;
export type CreateGifAiPresetData = z.infer<typeof createGifAiPresetSchema>;
export type UpdateGifAiPresetData = z.infer<typeof updateGifAiPresetSchema>;
export type CreateVideoAiPresetData = z.infer<typeof createVideoAiPresetSchema>;
export type UpdateVideoAiPresetData = z.infer<typeof updateVideoAiPresetSchema>;

// Legacy aliases for creation/update types
/** @deprecated Use CreatePhotoAiPresetData instead */
export type CreatePhotoExperienceData = CreatePhotoAiPresetData;
/** @deprecated Use UpdatePhotoAiPresetData instead */
export type UpdatePhotoExperienceData = UpdatePhotoAiPresetData;
/** @deprecated Use CreateGifAiPresetData instead */
export type CreateGifExperienceData = CreateGifAiPresetData;
/** @deprecated Use UpdateGifAiPresetData instead */
export type UpdateGifExperienceData = UpdateGifAiPresetData;
/** @deprecated Use CreateVideoAiPresetData instead */
export type CreateVideoExperienceData = CreateVideoAiPresetData;
/** @deprecated Use UpdateVideoAiPresetData instead */
export type UpdateVideoExperienceData = UpdateVideoAiPresetData;

// Type alias for AI Preset union
export type AiPresetSchema = AiPreset;
/** @deprecated Use AiPresetSchema instead */
export type ExperienceSchema = AiPreset;

// Playground Types
export type PlaygroundGenerateInput = z.infer<typeof playgroundGenerateInputSchema>;
export type PlaygroundGenerateOutput = z.infer<typeof playgroundGenerateOutputSchema>;

// ============================================================================
// Schema Exports (for validation)
// ============================================================================

export {
  photoCaptureConfigSchema,
  videoCaptureConfigSchema,
  gifCaptureConfigSchema,
  aiPhotoConfigSchema,
  aiVideoConfigSchema,
};
