/**
 * Welcome Editor Schemas
 *
 * Schemas for welcome screen configuration updates (write validation).
 * Uses shared mediaReferenceSchema for hero media.
 *
 * Note: This update schema enforces max limits for writes.
 * The read schema (welcomeConfigSchema) is permissive to handle existing data.
 */
import { z } from 'zod'
import {
  WELCOME_DESCRIPTION_MAX_LENGTH,
  WELCOME_TITLE_MAX_LENGTH,
} from '../constants'
import { mediaReferenceSchema } from '@/shared/theming'
import { experiencePickerLayoutSchema } from '@/domains/event/shared'

/**
 * Schema for partial welcome updates
 * All fields optional for granular updates
 * Enforces max length limits for title and description
 */
export const updateWelcomeSchema = z.object({
  title: z.string().max(WELCOME_TITLE_MAX_LENGTH).optional(),
  description: z
    .string()
    .max(WELCOME_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
  media: mediaReferenceSchema.nullable().optional(),
  layout: experiencePickerLayoutSchema.optional(),
})

export type UpdateWelcome = z.infer<typeof updateWelcomeSchema>

// Re-export types from shared for convenience
export type {
  WelcomeConfig,
  ExperiencePickerLayout,
} from '@/domains/event/shared'

// Re-export constants from local constants for convenience
export {
  WELCOME_TITLE_MAX_LENGTH,
  WELCOME_DESCRIPTION_MAX_LENGTH,
} from '../constants'
