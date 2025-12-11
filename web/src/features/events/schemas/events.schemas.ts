// Zod schemas for Event data models
import { z } from "zod";
import { NAME_LENGTH } from "../constants";
import {
  themeSchema,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  updateThemeSchema,
} from "@/features/theming";

// Re-export theme schemas for backward compatibility
export const eventThemeTextSchema = themeTextSchema;
export const eventThemeButtonSchema = themeButtonSchema;
export const eventThemeBackgroundSchema = themeBackgroundSchema;
export const eventThemeSchema = themeSchema;

// ============================================================================
// Welcome Screen Schemas
// ============================================================================

/**
 * Experience layout schema (list or grid)
 */
export const experienceLayoutSchema = z.enum(["list", "grid"]);

/**
 * Event welcome screen configuration schema
 * Note: layout is required; use DEFAULT_EVENT_WELCOME for default values
 */
export const eventWelcomeSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  layout: experienceLayoutSchema,
});

/**
 * Update event welcome screen input schema (for server action)
 */
export const updateEventWelcomeSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  layout: experienceLayoutSchema.optional(),
});

/**
 * Frequency options for extra slots
 */
export const extraSlotFrequencySchema = z.enum(["always", "once_per_session"]);

/**
 * Extra slot identifier
 */
export const extraSlotSchema = z.enum(["preEntryGate", "preReward"]);

/**
 * Event-Experience link schema (used for experiences array and extras slots)
 */
export const eventExperienceLinkSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional().default(null),
  enabled: z.boolean().default(true),
  frequency: extraSlotFrequencySchema.nullable().optional().default(null),
});

/**
 * Event Extras schema (slot-based flows)
 */
export const eventExtrasSchema = z.object({
  preEntryGate: eventExperienceLinkSchema.nullable().optional().default(null),
  preReward: eventExperienceLinkSchema.nullable().optional().default(null),
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
  extras: eventExtrasSchema.default({ preEntryGate: null, preReward: null }),
  theme: eventThemeSchema,
  welcome: eventWelcomeSchema.optional(),
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
export const updateEventThemeInputSchema = updateThemeSchema;

// ============================================================================
// Experience Actions Input Schemas
// ============================================================================

/**
 * Add experience to event input
 */
export const addEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
});

/**
 * Update event experience input
 */
export const updateEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Remove event experience input
 */
export const removeEventExperienceInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  experienceId: z.string().min(1, "Experience ID is required"),
});

// ============================================================================
// Extras Actions Input Schemas
// ============================================================================

/**
 * Set extra slot input
 */
export const setEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional().default(true),
  frequency: extraSlotFrequencySchema,
});

/**
 * Update extra slot input
 */
export const updateEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
  frequency: extraSlotFrequencySchema.optional(),
});

/**
 * Remove extra slot input
 */
export const removeEventExtraInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  slot: extraSlotSchema,
});

// ============================================================================
// Type Exports
// ============================================================================

export type EventSchema = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventInputSchema>;
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;
export type UpdateEventThemeInput = z.infer<typeof updateEventThemeInputSchema>;
export type ExtraSlot = z.infer<typeof extraSlotSchema>;
export type AddEventExperienceInput = z.infer<typeof addEventExperienceInputSchema>;
export type UpdateEventExperienceInput = z.infer<typeof updateEventExperienceInputSchema>;
export type RemoveEventExperienceInput = z.infer<typeof removeEventExperienceInputSchema>;
export type SetEventExtraInput = z.infer<typeof setEventExtraInputSchema>;
export type UpdateEventExtraInput = z.infer<typeof updateEventExtraInputSchema>;
export type RemoveEventExtraInput = z.infer<typeof removeEventExtraInputSchema>;
export type ExperienceLayout = z.infer<typeof experienceLayoutSchema>;
export type EventWelcomeSchema = z.infer<typeof eventWelcomeSchema>;
export type UpdateEventWelcomeInput = z.infer<typeof updateEventWelcomeSchema>;
