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

// Survey Experience Configuration
const surveyConfigSchema = z.object({
  stepsOrder: z.array(z.string()).max(10, "Maximum 10 steps allowed"),
  required: z.boolean().default(false),
  showProgressBar: z.boolean().default(true),
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

// Create Photo Experience
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

// Create GIF Experience
export const createGifExperienceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(50, "Experience name must be 50 characters or less"),
  type: z.literal("gif"),
});

// Update GIF Experience (partial updates allowed)
export const updateGifExperienceSchema = z
  .object({
    label: z.string().min(1).max(50).optional(),
    enabled: z.boolean().optional(),
    hidden: z.boolean().optional(),
    previewPath: z.string().url().optional(),
    previewType: previewTypeSchema.optional(),
    config: gifConfigSchema.partial().optional(),
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
// SurveyStep Schemas (Discriminated Union)
// ============================================================================

export const surveyStepTypeSchema = z.enum([
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "opinion_scale",
  "email",
  "statement",
]);

// Base schema with common fields for all step types
const stepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string().min(1, "Title required").max(200, "Max 200 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
  required: z.boolean().nullable().default(null), // null = inherit from experience
  helperText: z.string().max(200, "Max 200 characters").optional(),
  ctaLabel: z.string().min(1).max(50, "Max 50 characters").optional(),
  mediaUrl: z.string().url().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Type-specific step schemas

export const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal("multiple_choice"),
  config: z.object({
    options: z
      .array(
        z.string().min(1, "Option cannot be empty").max(100, "Max 100 characters")
      )
      .min(1, "At least 1 option required")
      .max(10, "Max 10 options"),
    allowMultiple: z.boolean().default(false),
  }),
});

export const yesNoStepSchema = stepBaseSchema.extend({
  type: z.literal("yes_no"),
  config: z
    .object({
      yesLabel: z.string().min(1).max(50, "Max 50 characters").optional(),
      noLabel: z.string().min(1).max(50, "Max 50 characters").optional(),
    })
    .optional(),
});

export const opinionScaleStepSchema = stepBaseSchema.extend({
  type: z.literal("opinion_scale"),
  config: z
    .object({
      scaleMin: z.number().int("Must be an integer"),
      scaleMax: z.number().int("Must be an integer"),
      minLabel: z.string().max(50, "Max 50 characters").optional(),
      maxLabel: z.string().max(50, "Max 50 characters").optional(),
    })
    .refine((data) => data.scaleMin < data.scaleMax, {
      message: "Min value must be less than max value",
      path: ["scaleMin"],
    }),
});

export const shortTextStepSchema = stepBaseSchema.extend({
  type: z.literal("short_text"),
  config: z
    .object({
      placeholder: z.string().max(100, "Max 100 characters").optional(),
      maxLength: z
        .number()
        .int()
        .positive()
        .max(500, "Max 500 characters")
        .optional(),
    })
    .optional(),
});

export const longTextStepSchema = stepBaseSchema.extend({
  type: z.literal("long_text"),
  config: z
    .object({
      placeholder: z.string().max(100, "Max 100 characters").optional(),
      maxLength: z
        .number()
        .int()
        .positive()
        .max(2000, "Max 2000 characters")
        .optional(),
    })
    .optional(),
});

export const emailStepSchema = stepBaseSchema.extend({
  type: z.literal("email"),
  config: z
    .object({
      placeholder: z.string().max(100, "Max 100 characters").optional(),
    })
    .optional(),
});

export const statementStepSchema = stepBaseSchema.extend({
  type: z.literal("statement"),
  config: z.null().optional(),
});

// Discriminated union of all step types
export const surveyStepSchema = z.discriminatedUnion("type", [
  multipleChoiceStepSchema,
  yesNoStepSchema,
  opinionScaleStepSchema,
  shortTextStepSchema,
  longTextStepSchema,
  emailStepSchema,
  statementStepSchema,
]);

// Creation schemas for each step type
export const createMultipleChoiceStepSchema = z.object({
  type: z.literal("multiple_choice"),
  title: z.string().min(1).max(200).default("Multiple Choice Question"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z.object({
    options: z
      .array(z.string().min(1).max(100))
      .min(1)
      .max(10)
      .default(["Option 1"]),
    allowMultiple: z.boolean().default(false),
  }),
});

export const createYesNoStepSchema = z.object({
  type: z.literal("yes_no"),
  title: z.string().min(1).max(200).default("Yes/No Question"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z
    .object({
      yesLabel: z.string().min(1).max(50).optional(),
      noLabel: z.string().min(1).max(50).optional(),
    })
    .optional(),
});

export const createOpinionScaleStepSchema = z.object({
  type: z.literal("opinion_scale"),
  title: z.string().min(1).max(200).default("Opinion Scale"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z.object({
    scaleMin: z.number().int().default(1),
    scaleMax: z.number().int().default(5),
    minLabel: z.string().max(50).optional(),
    maxLabel: z.string().max(50).optional(),
  }),
});

export const createShortTextStepSchema = z.object({
  type: z.literal("short_text"),
  title: z.string().min(1).max(200).default("Short Text Question"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z
    .object({
      placeholder: z.string().max(100).optional(),
      maxLength: z.number().int().positive().max(500).optional(),
    })
    .optional(),
});

export const createLongTextStepSchema = z.object({
  type: z.literal("long_text"),
  title: z.string().min(1).max(200).default("Long Text Question"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z
    .object({
      placeholder: z.string().max(100).optional(),
      maxLength: z.number().int().positive().max(2000).optional(),
    })
    .optional(),
});

export const createEmailStepSchema = z.object({
  type: z.literal("email"),
  title: z.string().min(1).max(200).default("Email Address"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z
    .object({
      placeholder: z.string().max(100).optional(),
    })
    .optional(),
});

export const createStatementStepSchema = z.object({
  type: z.literal("statement"),
  title: z.string().min(1).max(200).default("Statement"),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  config: z.null().optional(),
});

// Union of all create step schemas
export const createSurveyStepSchema = z.discriminatedUnion("type", [
  createMultipleChoiceStepSchema,
  createYesNoStepSchema,
  createOpinionScaleStepSchema,
  createShortTextStepSchema,
  createLongTextStepSchema,
  createEmailStepSchema,
  createStatementStepSchema,
]);

// Update schema (partial updates for any step type)
export const updateSurveyStepSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().optional(),
  helperText: z.string().max(200).optional(),
  ctaLabel: z.string().min(1).max(50).optional(),
  mediaUrl: z.string().url().optional(),
  config: z.record(z.string(), z.any()).optional(), // Allow any config updates
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

// Survey Step Types
export type SurveyStep = z.infer<typeof surveyStepSchema>;
export type StepType = z.infer<typeof surveyStepTypeSchema>;
export type MultipleChoiceStep = z.infer<typeof multipleChoiceStepSchema>;
export type YesNoStep = z.infer<typeof yesNoStepSchema>;
export type OpinionScaleStep = z.infer<typeof opinionScaleStepSchema>;
export type ShortTextStep = z.infer<typeof shortTextStepSchema>;
export type LongTextStep = z.infer<typeof longTextStepSchema>;
export type EmailStep = z.infer<typeof emailStepSchema>;
export type StatementStep = z.infer<typeof statementStepSchema>;

// Survey Step Creation Types
export type CreateSurveyStepData = z.infer<typeof createSurveyStepSchema>;
export type UpdateSurveyStepData = z.infer<typeof updateSurveyStepSchema>;

// Creation/Update Types
export type CreatePhotoExperienceData = z.infer<typeof createPhotoExperienceSchema>;
export type UpdatePhotoExperienceData = z.infer<typeof updatePhotoExperienceSchema>;
export type CreateGifExperienceData = z.infer<typeof createGifExperienceSchema>;
export type UpdateGifExperienceData = z.infer<typeof updateGifExperienceSchema>;

// Type alias for Experience union
export type ExperienceSchema = Experience;
