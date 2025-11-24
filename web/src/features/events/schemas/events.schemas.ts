// Zod schemas for Event data models
import { z } from "zod";
import {
  NAME_LENGTH,
  COLOR_REGEX,
} from "../constants";

// Event schemas
export const eventStatusSchema = z.enum(["draft", "published", "archived"]);

/**
 * Theme text configuration
 */
export const eventThemeTextSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  alignment: z.enum(["left", "center", "right"]),
});

/**
 * Theme button configuration
 */
export const eventThemeButtonSchema = z.object({
  backgroundColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  textColor: z.string().regex(COLOR_REGEX),
  radius: z.enum(["none", "sm", "md", "full"]),
});

/**
 * Theme background configuration
 */
export const eventThemeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  image: z.string().url().nullable().optional().default(null),
  overlayOpacity: z.number().min(0).max(1),
});

/**
 * Event-wide theme settings for visual customization
 */
export const eventThemeSchema = z.object({
  logoUrl: z.string().url().nullable().optional().default(null),
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX),
  text: eventThemeTextSchema,
  button: eventThemeButtonSchema,
  background: eventThemeBackgroundSchema,
});

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: eventStatusSchema,
  ownerId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),

  // Switchboard pattern - controls which journey is active
  activeJourneyId: z.string().nullable().optional().default(null),

  // Nested object configurations
  theme: eventThemeSchema,

  createdAt: z.number(),
  updatedAt: z.number(),
});

// Event update schemas (for Server Actions)
export const updateEventThemeSchema = z.object({
  logoUrl: z.string().url().nullable().optional().default(null),
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX).optional(),
  text: eventThemeTextSchema.partial().optional(),
  button: eventThemeButtonSchema.partial().optional(),
  background: eventThemeBackgroundSchema.partial().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;
