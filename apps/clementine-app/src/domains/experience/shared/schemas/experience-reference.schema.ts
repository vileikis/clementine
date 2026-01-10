/**
 * Experience Reference Schema
 *
 * References an experience within an event's configuration.
 * Used in EventExperiencesConfig for main, pregate, and preshare slots.
 *
 * This schema uses Firestore-safe patterns:
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'

/**
 * Experience Reference Schema (Draft)
 *
 * Reference to a workspace experience for draft event configuration.
 * Points to the mutable workspace experience.
 */
export const experienceReferenceSchema = z.looseObject({
  /** Reference to workspace experience ID */
  experienceId: z.string(),

  /** Whether experience is active in event */
  enabled: z.boolean().default(true),
})

/**
 * Published Experience Reference Schema
 *
 * Reference for published event configuration.
 * Includes releaseId pointing to frozen snapshot.
 */
export const publishedExperienceReferenceSchema = z.looseObject({
  /** Reference to workspace experience ID (for tracking) */
  experienceId: z.string(),

  /** Reference to frozen release snapshot */
  releaseId: z.string(),

  /** Whether experience is active in event */
  enabled: z.boolean().default(true),
})

/**
 * TypeScript types exported from schemas
 */
export type ExperienceReference = z.infer<typeof experienceReferenceSchema>
export type PublishedExperienceReference = z.infer<
  typeof publishedExperienceReferenceSchema
>
