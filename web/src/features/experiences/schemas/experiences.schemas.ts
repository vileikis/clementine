import { z } from "zod";
import { EXPERIENCE_CONSTRAINTS } from "../constants";

export const experienceStatusSchema = z.enum(["active", "deleted"]);

export const experiencePreviewTypeSchema = z.enum(["image", "gif"]);

export const experienceSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  name: z
    .string()
    .min(EXPERIENCE_CONSTRAINTS.NAME_LENGTH.min)
    .max(EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max),
  description: z
    .string()
    .max(EXPERIENCE_CONSTRAINTS.DESCRIPTION_LENGTH.max)
    .nullable()
    .optional(),
  stepsOrder: z.array(z.string()).default([]),
  status: experienceStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  // Preview media (optional)
  previewMediaUrl: z
    .string()
    .url("Invalid URL format")
    .max(EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.URL_MAX_LENGTH, "URL too long")
    .nullable()
    .optional(),
  previewType: experiencePreviewTypeSchema.nullable().optional(),
});

export type ExperienceSchema = z.infer<typeof experienceSchema>;

// Create experience input validation
export const createExperienceInputSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  name: z
    .string()
    .trim()
    .min(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.min,
      "Experience name is required"
    )
    .max(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max,
      "Experience name too long"
    ),
});

export type CreateExperienceInput = z.infer<typeof createExperienceInputSchema>;

// Update experience input validation
export const updateExperienceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.min,
      "Experience name is required"
    )
    .max(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max,
      "Experience name too long"
    )
    .optional(),
  description: z
    .string()
    .max(
      EXPERIENCE_CONSTRAINTS.DESCRIPTION_LENGTH.max,
      "Description too long"
    )
    .nullable()
    .optional(),
});

export type UpdateExperienceInput = z.infer<typeof updateExperienceInputSchema>;

// Update experience settings input validation (for settings form)
export const updateExperienceSettingsInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.min,
      "Experience name is required"
    )
    .max(
      EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max,
      "Experience name too long"
    )
    .optional(),
  description: z
    .string()
    .max(
      EXPERIENCE_CONSTRAINTS.DESCRIPTION_LENGTH.max,
      "Description too long"
    )
    .nullable()
    .optional(),
  previewMediaUrl: z
    .string()
    .url("Invalid URL format")
    .max(EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.URL_MAX_LENGTH, "URL too long")
    .nullable()
    .optional(),
  previewType: experiencePreviewTypeSchema.nullable().optional(),
});

export type UpdateExperienceSettingsInput = z.infer<
  typeof updateExperienceSettingsInputSchema
>;
