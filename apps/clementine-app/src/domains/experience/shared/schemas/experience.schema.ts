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
 * Experience Profile enum schema
 *
 * Defines valid experience patterns for validation.
 * Forward declaration - full implementation in profile.types.ts
 */
export const experienceProfileSchema = z.enum([
  'free',
  'photobooth',
  'survey',
  'gallery',
])

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
 * Contains schema version, profile type, and step definitions.
 */
export const experienceConfigSchema = z.looseObject({
  /**
   * Schema version for migration tracking
   */
  schemaVersion: z.number().default(1),

  /**
   * Experience profile type
   * Determines validation rules for step sequences
   */
  profile: experienceProfileSchema.default('free'),

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
  status: z.enum(['active', 'deleted']).default('active'),

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
  draftConfig: experienceConfigSchema.nullable().default(null),

  /** Published configuration (live for guests) */
  publishedConfig: experienceConfigSchema.nullable().default(null),

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
export type ExperienceProfileValue = z.infer<typeof experienceProfileSchema>
