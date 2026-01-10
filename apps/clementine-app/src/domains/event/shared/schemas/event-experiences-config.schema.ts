/**
 * Event Experiences Configuration Schema
 *
 * Defines the structure for experience assignments in event configuration.
 * This schema is embedded within ProjectEventConfig as the `experiences` field.
 *
 * Slot Semantics:
 * - main: Multiple experiences, displayed on Welcome screen, guest selects one
 * - pregate: Optional single experience, runs before Welcome screen
 * - preshare: Optional single experience, runs after main experience, before share
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'
import {
  experienceReferenceSchema,
  publishedExperienceReferenceSchema,
} from '@/domains/experience/shared/schemas'

/**
 * Event Experiences Config Schema (Draft)
 *
 * Configuration for experience slots in draft event configuration.
 * References mutable workspace experiences.
 */
export const eventExperiencesConfigSchema = z.looseObject({
  /**
   * Main experience slot
   * Array of experiences displayed on Welcome screen
   * Guest selects one to proceed
   */
  main: z.array(experienceReferenceSchema).default([]),

  /**
   * Pregate experience slot
   * Optional single experience that runs before Welcome screen
   * Allowed profiles: informational, survey
   */
  pregate: experienceReferenceSchema.nullable().default(null),

  /**
   * Preshare experience slot
   * Optional single experience that runs after main, before share
   * Allowed profiles: informational, survey
   */
  preshare: experienceReferenceSchema.nullable().default(null),
})

/**
 * Published Event Experiences Config Schema
 *
 * Configuration for experience slots in published event configuration.
 * References immutable experience releases (frozen snapshots).
 */
export const publishedEventExperiencesConfigSchema = z.looseObject({
  /**
   * Main experience slot (published)
   * References frozen experience releases
   */
  main: z.array(publishedExperienceReferenceSchema).default([]),

  /**
   * Pregate experience slot (published)
   */
  pregate: publishedExperienceReferenceSchema.nullable().default(null),

  /**
   * Preshare experience slot (published)
   */
  preshare: publishedExperienceReferenceSchema.nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type EventExperiencesConfig = z.infer<
  typeof eventExperiencesConfigSchema
>
export type PublishedEventExperiencesConfig = z.infer<
  typeof publishedEventExperiencesConfigSchema
>
