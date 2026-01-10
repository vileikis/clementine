/**
 * Experience Schema
 *
 * Defines the structure for Experience documents stored in Firestore.
 * An experience is a step-based interactive flow scoped to an Event.
 *
 * Firestore Path: /projects/{projectId}/events/{eventId}/experiences/{experienceId}
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'

/**
 * Experience status enum schema
 * Lifecycle state of an experience
 */
export const experienceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Experience Profile enum schema
 *
 * Categorizes experiences by their allowed step types:
 * - freeform: info, input, capture, transform, share (all steps)
 * - survey: info, input, capture, share (no transform)
 * - informational: info only
 */
export const experienceProfileSchema = z.enum([
  'freeform',
  'survey',
  'informational',
])

/**
 * Experience Slot enum schema
 *
 * Defines where an experience can be assigned in an event:
 * - main: Primary experiences shown after welcome (array, multiple allowed)
 * - pregate: Optional experience before welcome (single)
 * - preshare: Optional experience after main, before share (single)
 */
export const experienceSlotSchema = z.enum(['main', 'pregate', 'preshare'])

/**
 * Config version schema
 * Indicates whether config is draft or published
 */
export const configVersionSchema = z.enum(['draft', 'published'])

/**
 * Step config placeholder schema
 *
 * Placeholder for step configuration - full implementation in step-registry.schema.ts
 */
export const stepConfigSchema = z.looseObject({
  id: z.string(),
  category: z.string(),
  type: z.string(),
  label: z.string(),
})

/**
 * Experience Config Schema
 *
 * Configuration object that defines the structure and behavior of an experience.
 * Contains version indicator and step definitions.
 */
export const experienceConfigSchema = z.looseObject({
  /**
   * Config version indicator
   * Indicates whether this is a draft or published config
   */
  version: configVersionSchema,

  /**
   * Array of step configurations
   * Defines the sequence of steps in the experience
   */
  steps: z.array(stepConfigSchema).default([]),
})

/**
 * Experience Schema
 *
 * Complete experience document schema including both admin metadata and configuration.
 */
export const experienceSchema = z.looseObject({
  /**
   * IDENTITY
   */

  /** Unique experience identifier (Firestore document ID) */
  id: z.string(),

  /** Experience display name */
  name: z.string().min(1).max(100),

  /**
   * METADATA
   */

  /** Experience lifecycle status */
  status: experienceStatusSchema.default('active'),

  /**
   * Experience profile type
   * Determines validation rules for step sequences
   */
  profile: experienceProfileSchema.default('freeform'),

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),

  /** Soft delete timestamp (Unix ms) */
  deletedAt: z.number().nullable().default(null),

  /**
   * CONFIGURATION (draft vs published)
   */

  /** Draft configuration (work in progress) */
  draft: experienceConfigSchema.nullable().default(null),

  /** Published configuration (live for guests) */
  published: experienceConfigSchema.nullable().default(null),

  /**
   * VERSION TRACKING
   */

  /** Draft version number (starts at 1, not 0) */
  draftVersion: z.number().default(1),

  /** Published version number */
  publishedVersion: z.number().nullable().default(null),

  /** Publish timestamp (Unix ms) */
  publishedAt: z.number().nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type Experience = z.infer<typeof experienceSchema>
export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
export type ExperienceSlot = z.infer<typeof experienceSlotSchema>
export type ConfigVersion = z.infer<typeof configVersionSchema>
