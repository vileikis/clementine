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
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  backgroundImage: z.string().url().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

/**
 * Ending screen configuration
 */
export const eventEndingSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  ctaUrl: z.string().url().optional(),
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
  share: eventShareConfigSchema.optional(),

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
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  backgroundImage: z.string().url().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateEventEndingSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  ctaUrl: z.string().url().optional(),
});

export const updateEventShareSchema = z.object({
  allowDownload: z.boolean().optional(),
  allowSystemShare: z.boolean().optional(),
  allowEmail: z.boolean().optional(),
  socials: z.array(shareSocialSchema).optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;
