// Zod schemas for Project data models
import { z } from "zod";
import {
  NAME_LENGTH,
  COLOR_REGEX,
} from "../constants";

// Project schemas
export const projectStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);

/**
 * Theme text configuration
 */
export const projectThemeTextSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  alignment: z.enum(["left", "center", "right"]),
});

/**
 * Theme button configuration
 */
export const projectThemeButtonSchema = z.object({
  backgroundColor: z.string().regex(COLOR_REGEX).nullable().optional().default(null),
  textColor: z.string().regex(COLOR_REGEX),
  radius: z.enum(["none", "sm", "md", "full"]),
});

/**
 * Theme background configuration
 */
export const projectThemeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX),
  image: z.string().url().nullable().optional().default(null),
  overlayOpacity: z.number().min(0).max(1),
});

/**
 * Project-wide theme settings for visual customization
 */
export const projectThemeSchema = z.object({
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX),
  text: projectThemeTextSchema,
  button: projectThemeButtonSchema,
  background: projectThemeBackgroundSchema,
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: projectStatusSchema,
  companyId: z.string().nullable().default(null), // renamed from ownerId
  sharePath: z.string(), // renamed from joinPath
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),

  // Switchboard pattern - controls which event/experience is active
  activeEventId: z.string().nullable().optional().default(null), // renamed from activeJourneyId

  // Nested object configurations
  theme: projectThemeSchema,

  // Soft delete timestamp
  deletedAt: z.number().nullable().optional().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
});

// Project update schemas (for Server Actions)
export const updateProjectThemeSchema = z.object({
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX).optional(),
  text: projectThemeTextSchema.partial().optional(),
  button: projectThemeButtonSchema.partial().optional(),
  background: projectThemeBackgroundSchema.partial().optional(),
});

export type ProjectSchema = z.infer<typeof projectSchema>;
