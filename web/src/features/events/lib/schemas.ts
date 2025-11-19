// Zod schemas for Event data models
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

/**
 * Event-wide theme settings for visual customization
 */
export const eventThemeSchema = z.object({
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonTextColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundImage: z.string().url().optional(),
});

/**
 * Welcome screen configuration
 */
export const eventWelcomeSchema = z.object({
  title: z.string().max(500).nullable(),
  body: z.string().max(500).nullable(),
  ctaLabel: z.string().max(50).nullable(),
  backgroundImage: z.string().url().nullable(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).nullable(),
});

/**
 * Ending screen configuration
 */
export const eventEndingSchema = z.object({
  title: z.string().max(500).nullable(),
  body: z.string().max(500).nullable(),
  ctaLabel: z.string().max(50).nullable(),
  ctaUrl: z.string().url().nullable(),
});

/**
 * Share settings configuration
 */
export const eventShareConfigSchema = z.object({
  allowDownload: z.boolean().default(true),
  allowSystemShare: z.boolean().default(true),
  allowEmail: z.boolean().default(false),
  socials: z.array(shareSocialSchema).default([]),
});

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  status: eventStatusSchema,
  companyId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().optional(),
  publishEndAt: z.number().optional(),

  // Nested object configurations
  theme: eventThemeSchema.optional(),
  welcome: eventWelcomeSchema.optional(),
  ending: eventEndingSchema.optional(),
  share: eventShareConfigSchema.default({
    allowDownload: true,
    allowSystemShare: true,
    allowEmail: false,
    socials: [],
  }),

  // Denormalized counters
  experiencesCount: z.number().default(0),
  sessionsCount: z.number().default(0),
  readyCount: z.number().default(0),
  sharesCount: z.number().default(0),

  createdAt: z.number(),
  updatedAt: z.number(),
});

// Event update schemas (for Server Actions)
export const updateEventThemeSchema = z.object({
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonTextColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundImage: z.string().url().optional(),
});

export const updateEventWelcomeSchema = z.object({
  title: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(500).nullable().optional()
  ),
  body: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(500).nullable().optional()
  ),
  ctaLabel: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(50).nullable().optional()
  ),
  backgroundImage: z.preprocess(
    val => val === "" ? null : val,
    z.string().url().nullable().optional()
  ),
  backgroundColor: z.preprocess(
    val => val === "" ? null : val,
    z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional()
  ),
});

export const updateEventEndingSchema = z.object({
  title: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(500).nullable().optional()
  ),
  body: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(500).nullable().optional()
  ),
  ctaLabel: z.preprocess(
    val => val === "" ? null : val,
    z.string().max(50).nullable().optional()
  ),
  ctaUrl: z.preprocess(
    val => val === "" ? null : val,
    z.string().url().nullable().optional()
  ),
});

export const updateEventShareSchema = z.object({
  allowDownload: z.boolean().default(false),
  allowSystemShare: z.boolean().default(false),
  allowEmail: z.boolean().default(false),
  socials: z.array(shareSocialSchema).default([]),
});

export type EventSchema = z.infer<typeof eventSchema>;
