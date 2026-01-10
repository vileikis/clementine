/**
 * Experience Release Schema
 *
 * Defines the structure for ExperienceRelease documents stored in Firestore.
 * An experience release is an immutable snapshot of an experience created at event publish time.
 *
 * Firestore Path: /projects/{projectId}/experienceReleases/{releaseId}
 *
 * Key Invariants:
 * - Document is immutable after creation (no updates allowed)
 * - `data` field contains complete frozen copy of experience configuration
 * - Guests read releases, never mutable workspace experiences
 *
 * This schema uses Firestore-safe patterns:
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'
import {
  experienceMediaSchema,
  experienceProfileSchema,
} from '@/domains/experience/shared/schemas'

/**
 * Experience Release Data Schema
 *
 * Frozen copy of experience configuration at publish time.
 */
export const experienceReleaseDataSchema = z.looseObject({
  /** Frozen profile type */
  profile: experienceProfileSchema,

  /** Frozen media configuration */
  media: experienceMediaSchema.nullable().default(null),

  /** Frozen step configurations */
  steps: z.array(z.unknown()).default([]),
})

/**
 * Experience Release Schema
 *
 * Complete experience release document schema.
 * Created during event publish, read by guests.
 */
export const experienceReleaseSchema = z.looseObject({
  /** Unique release identifier (Firestore document ID) */
  id: z.string(),

  /** Source workspace experience ID (for tracking) */
  experienceId: z.string(),

  /** Event that triggered publish */
  sourceEventId: z.string(),

  /** Frozen experience data */
  data: experienceReleaseDataSchema,

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** User ID who published */
  createdBy: z.string(),
})

/**
 * TypeScript types exported from schemas
 */
export type ExperienceReleaseData = z.infer<typeof experienceReleaseDataSchema>
export type ExperienceRelease = z.infer<typeof experienceReleaseSchema>
