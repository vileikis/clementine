// Zod schemas for Event data models
import { z } from "zod";
import {
  TITLE_LENGTH,
  COLOR_REGEX,
  SHARE_CONFIG_DEFAULTS,
} from "../constants";

// Event schemas
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);

/**
 * Event-wide theme settings for visual customization
 */
export const eventThemeSchema = z.object({
  buttonColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  buttonTextColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  backgroundColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  backgroundImage: z.string().url().nullable().optional().default(null),
});

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(TITLE_LENGTH.MIN).max(TITLE_LENGTH.MAX),
  status: eventStatusSchema,
  companyId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),

  // Nested object configurations
  theme: eventThemeSchema.nullable().optional().default(null),

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
  buttonColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  buttonTextColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  backgroundColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  backgroundImage: z.string().url().nullable().optional().default(null),
});

export type EventSchema = z.infer<typeof eventSchema>;
