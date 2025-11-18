// Zod schemas for Event and Scene data models
import { z } from "zod";

// Event schemas
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

// Scene schemas
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

export type EventSchema = z.infer<typeof eventSchema>;
export type SceneSchema = z.infer<typeof sceneSchema>;
