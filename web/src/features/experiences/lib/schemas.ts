// Zod schemas for Experience and Survey data models using discriminated unions
import { z } from "zod";

// ============================================================================
// Enums and Primitive Schemas
// ============================================================================

export const experienceTypeSchema = z.enum([
  "photo",
  "video",
  "gif",
  "wheel",
  "survey",
]);

export const previewTypeSchema = z.enum(["image", "gif", "video"]);

export const aspectRatioSchema = z.enum([
  "1:1",
  "3:4",
  "4:5",
  "9:16",
  "16:9",
]);

// ============================================================================
// Base Experience Schema (Shared Fields)
// ============================================================================

const baseExperienceSchema = z.object({
  id: z.string(),
  eventId: z.string(),

  // Core Configuration
  label: z.string().min(1).max(50),
  type: experienceTypeSchema,
  enabled: z.boolean(),
  hidden: z.boolean().default(false),

  // Preview Media (optional)
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),

  // Audit
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// ============================================================================
// Type-Specific Configuration Schemas
// ============================================================================

// Photo Experience Configuration
const photoConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10), // 0 = disabled, 1-10 = seconds
  overlayFramePath: z.string().url().nullable(), // null = no overlay
});

// AI Configuration (shared by photo, video, gif experiences)
const aiConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().nullable(), // null = no model
  prompt: z.string().max(600).nullable(), // null = no prompt
  referenceImagePaths: z.array(z.string().url()).max(5).nullable(), // null = no references
  aspectRatio: aspectRatioSchema,
});

// Video Experience Configuration (Future)
const videoConfigSchema = z.object({
  maxDurationSeconds: z.number().int().min(1).max(60),
  allowRetake: z.boolean(),
  countdown: z.number().int().min(0).max(10).optional(),
});

// GIF Experience Configuration (Future)
const gifConfigSchema = z.object({
  frameCount: z.number().int().min(3).max(10),
  intervalMs: z.number().int().min(100).max(1000),
  loopCount: z.number().int().min(0), // 0 = infinite
  countdown: z.number().int().min(0).max(10).optional(),
});

// Wheel Experience Configuration (Future)
const wheelItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Hex color
  imagePath: z.string().url().optional(),
});

const wheelConfigSchema = z.object({
  items: z.array(wheelItemSchema).min(2).max(12),
  spinDurationMs: z.number().int().min(2000).max(5000),
  autoSpin: z.boolean(),
});

// Survey Experience Configuration (Future)
const surveyConfigSchema = z.object({
  surveyStepIds: z.array(z.string()),
  required: z.boolean(),
  showProgressBar: z.boolean(),
});

// ============================================================================
// Discriminated Union Experience Schemas
// ============================================================================

export const photoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("photo"),
  config: photoConfigSchema,
  aiConfig: aiConfigSchema,
});

export const videoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("video"),
  config: videoConfigSchema,
  aiConfig: aiConfigSchema,
});

export const gifExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("gif"),
  config: gifConfigSchema,
  aiConfig: aiConfigSchema,
});

export const wheelExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("wheel"),
  config: wheelConfigSchema,
  // Note: wheel experiences do NOT have aiConfig
});

export const surveyExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("survey"),
  config: surveyConfigSchema,
  // Note: survey experiences do NOT have aiConfig
});

// Discriminated Union - all experience types
export const experienceSchema = z.discriminatedUnion("type", [
  photoExperienceSchema,
  videoExperienceSchema,
  gifExperienceSchema,
  wheelExperienceSchema,
  surveyExperienceSchema,
]);

// ============================================================================
// Creation/Update Schemas
// ============================================================================

// Create Photo Experience (only photo type is currently implemented)
export const createPhotoExperienceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(50, "Experience name must be 50 characters or less"),
  type: z.literal("photo"),
});

// Update Photo Experience (partial updates allowed)
export const updatePhotoExperienceSchema = z
  .object({
    label: z.string().min(1).max(50).optional(),
    enabled: z.boolean().optional(),
    hidden: z.boolean().optional(),
    previewPath: z.string().url().optional(),
    previewType: previewTypeSchema.optional(),
    config: photoConfigSchema.partial().optional(),
    aiConfig: aiConfigSchema.partial().optional(),
  })
  .strict();

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
// SurveyStep Schemas (unchanged from legacy)
// ============================================================================

export const surveyStepTypeSchema = z.enum([
  "short_text",
  "long_text",
  "multiple_choice",
  "opinion_scale",
  "email",
  "statement",
]);

export const surveyStepSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  type: surveyStepTypeSchema,

  // Content
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(100).optional(),

  // Type-specific configuration
  options: z.array(z.string().max(100)).min(1).optional(),
  allowMultiple: z.boolean().optional(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),

  // Validation
  required: z.boolean(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createSurveyStepSchema = z
  .object({
    type: surveyStepTypeSchema,
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    placeholder: z.string().max(100).optional(),
    options: z.array(z.string().max(100)).min(1).optional(),
    allowMultiple: z.boolean().optional(),
    scaleMin: z.number().int().optional(),
    scaleMax: z.number().int().optional(),
    required: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.type !== "multiple_choice" ||
      (data.options && data.options.length > 0),
    { message: "options required for multiple_choice type" }
  )
  .refine(
    (data) =>
      data.type !== "opinion_scale" ||
      (data.scaleMin !== undefined &&
        data.scaleMax !== undefined &&
        data.scaleMin < data.scaleMax),
    {
      message:
        "scaleMin and scaleMax required and scaleMin < scaleMax for opinion_scale type",
    }
  );

export const updateSurveyStepSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(100).optional(),
  options: z.array(z.string().max(100)).min(1).optional(),
  allowMultiple: z.boolean().optional(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  required: z.boolean().optional(),
});

// ============================================================================
// TypeScript Type Exports
// ============================================================================

// Experience Types
export type PhotoExperience = z.infer<typeof photoExperienceSchema>;
export type VideoExperience = z.infer<typeof videoExperienceSchema>;
export type GifExperience = z.infer<typeof gifExperienceSchema>;
export type WheelExperience = z.infer<typeof wheelExperienceSchema>;
export type SurveyExperience = z.infer<typeof surveyExperienceSchema>;
export type Experience = z.infer<typeof experienceSchema>;

// Config Types
export type PhotoConfig = z.infer<typeof photoConfigSchema>;
export type VideoConfig = z.infer<typeof videoConfigSchema>;
export type GifConfig = z.infer<typeof gifConfigSchema>;
export type WheelConfig = z.infer<typeof wheelConfigSchema>;
export type SurveyConfig = z.infer<typeof surveyConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type WheelItem = z.infer<typeof wheelItemSchema>;

// Primitive Types
export type ExperienceType = z.infer<typeof experienceTypeSchema>;
export type PreviewType = z.infer<typeof previewTypeSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

// Survey Types
export type SurveyStepSchema = z.infer<typeof surveyStepSchema>;
export type SurveyStepType = z.infer<typeof surveyStepTypeSchema>;

// Type alias for Experience union
export type ExperienceSchema = Experience;
