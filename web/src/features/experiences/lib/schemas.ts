// Zod schemas for Experience and Survey data models
import { z } from "zod";

// Experience schemas
export const experienceTypeSchema = z.enum(["photo", "video", "gif", "wheel"]);
export const previewTypeSchema = z.enum(["image", "gif", "video"]);
export const aspectRatioSchema = z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]);

export const experienceSchema = z.object({
  id: z.string(),
  eventId: z.string(),

  // Basic configuration
  label: z.string().min(1).max(50),
  type: experienceTypeSchema,
  enabled: z.boolean(),

  // Preview configuration
  previewPath: z.string().optional(),
  previewType: previewTypeSchema.optional(),

  // Countdown configuration
  countdownEnabled: z.boolean().default(false),
  countdownSeconds: z.number().int().min(0).max(10).default(3),

  // Overlay configuration
  overlayEnabled: z.boolean().default(false),
  overlayFramePath: z.string().optional(),

  // AI transformation configuration
  aiEnabled: z.boolean(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
  aiAspectRatio: aspectRatioSchema.default("1:1"),

  createdAt: z.number(),
  updatedAt: z.number(),
});

// SurveyStep schemas
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

// Experience creation/update schemas
export const createExperienceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(50, "Experience name must be 50 characters or less"),
  type: experienceTypeSchema,
  enabled: z.boolean().default(true),
  aiEnabled: z.boolean().default(false),
});

export const updateExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  previewPath: z.string().optional(),
  previewType: previewTypeSchema.optional(),
  countdownEnabled: z.boolean().optional(),
  countdownSeconds: z.number().int().min(0).max(10).optional(),
  overlayEnabled: z.boolean().optional(),
  overlayFramePath: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
  aiAspectRatio: aspectRatioSchema.optional(),
}).strict();

// Preview media upload validation schemas
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

// SurveyStep creation/update schemas
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

export type ExperienceSchema = z.infer<typeof experienceSchema>;
export type SurveyStepSchema = z.infer<typeof surveyStepSchema>;
