// Zod schemas for Event data models
import { z } from "zod";
import { NAME_LENGTH, COLOR_REGEX } from "../constants";

/**
 * Theme text configuration schema
 */
export const eventThemeTextSchema = z.object({
  color: z.string().regex(COLOR_REGEX, "Invalid hex color format"),
  alignment: z.enum(["left", "center", "right"]),
});

/**
 * Theme button configuration schema
 */
export const eventThemeButtonSchema = z.object({
  backgroundColor: z
    .string()
    .regex(COLOR_REGEX, "Invalid hex color format")
    .nullable()
    .optional()
    .default(null),
  textColor: z.string().regex(COLOR_REGEX, "Invalid hex color format"),
  radius: z.enum(["none", "sm", "md", "full"]),
});

/**
 * Theme background configuration schema
 */
export const eventThemeBackgroundSchema = z.object({
  color: z.string().regex(COLOR_REGEX, "Invalid hex color format"),
  image: z.string().url().nullable().optional().default(null),
  overlayOpacity: z.number().min(0).max(1),
});

/**
 * Event-wide theme settings schema
 */
export const eventThemeSchema = z.object({
  logoUrl: z.string().url().nullable().optional().default(null),
  fontFamily: z.string().nullable().optional().default(null),
  primaryColor: z.string().regex(COLOR_REGEX, "Invalid hex color format"),
  text: eventThemeTextSchema,
  button: eventThemeButtonSchema,
  background: eventThemeBackgroundSchema,
});

/**
 * Event-Experience link schema
 */
export const eventExperienceLinkSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().nullable().optional().default(null),
});

/**
 * Full Event schema for Firestore document validation
 */
export const eventSchema = z.object({
  id: z.string(),
  projectId: z.string().min(1, "Project ID is required"),
  companyId: z.string().min(1, "Company ID is required"),
  name: z
    .string()
    .min(NAME_LENGTH.MIN, "Name is required")
    .max(NAME_LENGTH.MAX, "Name too long"),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),
  experiences: z.array(eventExperienceLinkSchema).default([]),
  theme: eventThemeSchema,
  deletedAt: z.number().nullable().optional().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============================================================================
// Input Schemas (for Server Actions)
// ============================================================================

/**
 * Create event input schema
 */
export const createEventInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z
    .string()
    .min(NAME_LENGTH.MIN, "Name is required")
    .max(NAME_LENGTH.MAX, "Name too long"),
});

/**
 * Update event input schema (for name and scheduling)
 */
export const updateEventInputSchema = z.object({
  name: z
    .string()
    .min(NAME_LENGTH.MIN, "Name is required")
    .max(NAME_LENGTH.MAX, "Name too long")
    .optional(),
  publishStartAt: z.number().nullable().optional(),
  publishEndAt: z.number().nullable().optional(),
});

/**
 * Update event theme input schema (partial updates supported)
 */
export const updateEventThemeInputSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  primaryColor: z
    .string()
    .regex(COLOR_REGEX, "Invalid hex color format")
    .optional(),
  text: z
    .object({
      color: z
        .string()
        .regex(COLOR_REGEX, "Invalid hex color format")
        .optional(),
      alignment: z.enum(["left", "center", "right"]).optional(),
    })
    .optional(),
  button: z
    .object({
      backgroundColor: z
        .string()
        .regex(COLOR_REGEX, "Invalid hex color format")
        .nullable()
        .optional(),
      textColor: z
        .string()
        .regex(COLOR_REGEX, "Invalid hex color format")
        .optional(),
      radius: z.enum(["none", "sm", "md", "full"]).optional(),
    })
    .optional(),
  background: z
    .object({
      color: z
        .string()
        .regex(COLOR_REGEX, "Invalid hex color format")
        .optional(),
      image: z.string().url().nullable().optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type EventSchema = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventInputSchema>;
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;
export type UpdateEventThemeInput = z.infer<typeof updateEventThemeInputSchema>;
