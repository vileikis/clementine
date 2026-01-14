/**
 * Experience Schema
 *
 * Defines the structure for Experience documents stored in Firestore.
 * An experience is a step-based interactive flow scoped to a Workspace.
 *
 * Firestore Path: /workspaces/{workspaceId}/experiences/{experienceId}
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
 * Defines valid experience profiles that determine allowed step types.
 * - freeform: Full flexibility with info, input, capture, transform steps
 * - survey: Data collection with info, input, capture steps
 * - story: Display only with info steps
 *
 * Profile is immutable after experience creation.
 */
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'story'])

/**
 * Experience media schema
 *
 * Optional thumbnail or cover image for an experience.
 * Stored at root level for efficient list queries.
 */
export const experienceMediaSchema = z
  .object({
    /** Reference to media asset in media library */
    mediaAssetId: z.string().min(1),
    /** Full public URL for immediate rendering */
    url: z.string().url(),
  })
  .nullable()

/**
 * Step schema
 *
 * Defines the structure of a step stored in Firestore.
 * Note: `category` and `label` are registry metadata, not stored in documents.
 * They are derived at runtime from the step registry using the `type` field.
 */
export const stepSchema = z.looseObject({
  /** Unique step identifier within the experience (UUID) */
  id: z.string(),
  /** Step type from registry (e.g., 'info', 'input.scale') */
  type: z.string(),
  /** Step-specific configuration object */
  config: z.record(z.string(), z.unknown()).default({}),
})

/**
 * Experience Config Schema
 *
 * Configuration object that defines the structure and behavior of an experience.
 * Contains step definitions (version removed for simplicity).
 */
export const experienceConfigSchema = z.looseObject({
  /**
   * Array of steps
   * Defines the sequence of steps in the experience
   */
  steps: z.array(stepSchema).default([]),
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
   * Immutable after creation
   */
  profile: experienceProfileSchema,

  /** Optional thumbnail/cover image */
  media: experienceMediaSchema.default(null),

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
  draft: experienceConfigSchema,

  /** Published configuration (live for guests, null until first publish) */
  published: experienceConfigSchema.nullable().default(null),

  /**
   * PUBLISH TRACKING
   */

  /** Last publish timestamp (Unix ms) */
  publishedAt: z.number().nullable().default(null),

  /** UID of admin who last published */
  publishedBy: z.string().nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type Experience = z.infer<typeof experienceSchema>
export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
export type ExperienceMedia = z.infer<typeof experienceMediaSchema>
export type ExperienceStep = z.infer<typeof stepSchema>
