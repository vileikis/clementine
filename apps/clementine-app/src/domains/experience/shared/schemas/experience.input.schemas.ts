/**
 * Experience Input Schemas
 *
 * Zod schemas for validating experience CRUD operation inputs.
 * Used by mutation hooks to validate data before Firestore operations.
 */
import { z } from 'zod'

import { experienceMediaSchema, experienceTypeSchema } from '@clementine/shared'

/**
 * Create Experience Input Schema
 *
 * Validates input for creating a new experience.
 */
export const createExperienceInputSchema = z.object({
  /** Workspace ID where experience will be created */
  workspaceId: z.string().min(1, 'Workspace ID is required'),

  /** Experience display name */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),

  /** Experience type — determines the kind of experience and its output */
  type: experienceTypeSchema,
})

export type CreateExperienceInput = z.infer<typeof createExperienceInputSchema>

/**
 * Update Experience Input Schema
 *
 * Validates input for updating an existing experience.
 * Only name and media can be updated (profile is immutable).
 */
export const updateExperienceInputSchema = z.object({
  /** Workspace ID containing the experience */
  workspaceId: z.string().min(1, 'Workspace ID is required'),

  /** Experience ID to update */
  experienceId: z.string().min(1, 'Experience ID is required'),

  /** New name (optional) */
  name: z.string().min(1).max(100).optional(),

  /** New media/thumbnail (optional, set to null to remove) */
  media: experienceMediaSchema.optional(),
})

export type UpdateExperienceInput = z.infer<typeof updateExperienceInputSchema>

/**
 * Delete Experience Input Schema
 *
 * Validates input for soft-deleting an experience.
 */
export const deleteExperienceInputSchema = z.object({
  /** Workspace ID containing the experience */
  workspaceId: z.string().min(1, 'Workspace ID is required'),

  /** Experience ID to delete */
  experienceId: z.string().min(1, 'Experience ID is required'),
})

export type DeleteExperienceInput = z.infer<typeof deleteExperienceInputSchema>

/**
 * Duplicate Experience Input Schema
 *
 * Validates input for duplicating an existing experience.
 */
export const duplicateExperienceInputSchema = z.object({
  /** Workspace ID containing the experience */
  workspaceId: z.string().min(1, 'Workspace ID is required'),

  /** Source experience ID to duplicate */
  experienceId: z.string().min(1, 'Experience ID is required'),
})

export type DuplicateExperienceInput = z.infer<
  typeof duplicateExperienceInputSchema
>
