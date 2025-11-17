// Zod schemas for Firestore data models
import { z } from "zod";

// Event schema matching Event interface from types/firestore.ts
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);

export const shareSocialSchema = z.enum([
  "instagram",
  "tiktok",
  "facebook",
  "x",
  "snapchat",
  "whatsapp",
  "custom",
]);

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  showTitleOverlay: z.boolean(),
  status: eventStatusSchema,
  currentSceneId: z.string(),
  companyId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),

  // Events Builder Redesign fields with defaults
  welcomeTitle: z.string().optional(),
  welcomeDescription: z.string().optional(),
  welcomeCtaLabel: z.string().optional(),
  welcomeBackgroundImagePath: z.string().optional(),
  welcomeBackgroundColorHex: z.string().optional(),

  endHeadline: z.string().optional(),
  endBody: z.string().optional(),
  endCtaLabel: z.string().optional(),
  endCtaUrl: z.string().optional(),

  shareAllowDownload: z.boolean().default(true),
  shareAllowSystemShare: z.boolean().default(true),
  shareAllowEmail: z.boolean().default(true),
  shareSocials: z.array(shareSocialSchema).default([]),

  surveyEnabled: z.boolean().default(false),
  surveyRequired: z.boolean().default(false),
  surveyStepsCount: z.number().default(0),
  surveyStepsOrder: z.array(z.string()).default([]),
  surveyVersion: z.number().default(1),

  experiencesCount: z.number().default(0),
  sessionsCount: z.number().default(0),
  readyCount: z.number().default(0),
  sharesCount: z.number().default(0),
});

// Scene schema matching Scene interface from types/firestore.ts
export const captureModeSchema = z.enum(["photo", "video", "gif", "boomerang"]);
export const sceneStatusSchema = z.enum(["active", "deprecated"]);

export const sceneSchema = z.object({
  id: z.string(),
  label: z.string(),
  mode: captureModeSchema,
  prompt: z.string().nullable(),
  referenceImagePath: z.string().optional(),
  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),
  status: sceneStatusSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Session schema matching Session interface from types/firestore.ts
export const sessionStateSchema = z.enum([
  "created",
  "captured",
  "transforming",
  "ready",
  "error",
]);

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sceneId: z.string(),
  state: sessionStateSchema,
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Company schema matching Company interface from types/firestore.ts
export const companyStatusSchema = z.enum(["active", "deleted"]);

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Optional branding metadata
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  contactEmail: z.string().email().optional(),
  termsUrl: z.string().url().optional(),
  privacyUrl: z.string().url().optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type EventSchema = z.infer<typeof eventSchema>;
export type SceneSchema = z.infer<typeof sceneSchema>;
export type SessionSchema = z.infer<typeof sessionSchema>;
export type CompanySchema = z.infer<typeof companySchema>;

// ============================================================================
// Events Builder Redesign Schemas (001-events-builder-redesign)
// ============================================================================

// Experience schemas
export const experienceTypeSchema = z.enum(["photo", "video", "gif", "wheel"]);
export const previewTypeSchema = z.enum(["image", "gif", "video"]);

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

  // Capture configuration
  allowCamera: z.boolean(),
  allowLibrary: z.boolean(),
  maxDurationMs: z.number().int().positive().max(60000).optional(),
  frameCount: z.number().int().min(2).max(20).optional(),
  captureIntervalMs: z.number().int().positive().optional(),

  // Overlay configuration
  overlayFramePath: z.string().optional(),
  overlayLogoPath: z.string().optional(),

  // AI transformation configuration
  aiEnabled: z.boolean(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),

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

// Event update schemas (for Server Actions)
export const updateEventWelcomeSchema = z.object({
  welcomeTitle: z.string().max(500).optional(),
  welcomeDescription: z.string().max(500).optional(),
  welcomeCtaLabel: z.string().max(50).optional(),
  welcomeBackgroundImagePath: z.string().optional(),
  welcomeBackgroundColorHex: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateEventEndingSchema = z.object({
  endHeadline: z.string().max(500).optional(),
  endBody: z.string().max(500).optional(),
  endCtaLabel: z.string().max(50).optional(),
  endCtaUrl: z.string().url().optional(),
  shareAllowDownload: z.boolean().optional(),
  shareAllowSystemShare: z.boolean().optional(),
  shareAllowEmail: z.boolean().optional(),
  shareSocials: z.array(shareSocialSchema).optional(),
});

export const updateEventSurveyConfigSchema = z.object({
  surveyEnabled: z.boolean().optional(),
  surveyRequired: z.boolean().optional(),
  surveyStepsOrder: z.array(z.string()).optional(),
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
  allowCamera: z.boolean().optional(),
  allowLibrary: z.boolean().optional(),
  maxDurationMs: z.number().int().positive().max(60000).optional(),
  frameCount: z.number().int().min(2).max(20).optional(),
  captureIntervalMs: z.number().int().positive().optional(),
  overlayFramePath: z.string().optional(),
  overlayLogoPath: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
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
