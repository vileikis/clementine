import { z } from 'zod'

/**
 * Base experience reference - used for pregate/preshare slots
 */
export const experienceReferenceSchema = z.object({
  /** Experience document ID */
  experienceId: z.string().min(1, 'Experience ID is required'),
  /** Whether experience is enabled for guests */
  enabled: z.boolean().default(true),
})

/**
 * Main experience reference - includes overlay control
 */
export const mainExperienceReferenceSchema = experienceReferenceSchema.extend({
  /** Whether to apply event overlay on result media */
  applyOverlay: z.boolean().default(true),
})

/**
 * Complete experiences configuration for an event
 */
export const experiencesConfigSchema = z.object({
  /** Main experiences array (shown on welcome screen) */
  main: z.array(mainExperienceReferenceSchema).default([]),
  /** Pregate experience (runs before welcome) */
  pregate: experienceReferenceSchema.nullable().default(null),
  /** Preshare experience (runs after main, before share) */
  preshare: experienceReferenceSchema.nullable().default(null),
})

/**
 * TypeScript types
 */
export type ExperienceReference = z.infer<typeof experienceReferenceSchema>
export type MainExperienceReference = z.infer<
  typeof mainExperienceReferenceSchema
>
export type ExperiencesConfig = z.infer<typeof experiencesConfigSchema>

// Re-export SlotType and SlotMode for convenience
export type { SlotType, SlotMode } from '../constants'
