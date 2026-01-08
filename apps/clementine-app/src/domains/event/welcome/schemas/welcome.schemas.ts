/**
 * Welcome Editor Schemas
 *
 * Schemas for welcome screen configuration updates.
 * Uses shared mediaReferenceSchema for hero media.
 */
import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming'

/**
 * Schema for partial welcome updates
 * All fields optional for granular updates
 */
export const updateWelcomeSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  layout: z.enum(['list', 'grid']).optional(),
})

export type UpdateWelcome = z.infer<typeof updateWelcomeSchema>

// Re-export from shared for convenience
export type { WelcomeConfig } from '@/domains/event/shared'
