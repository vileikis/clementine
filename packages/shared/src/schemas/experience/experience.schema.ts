/**
 * Experience Schema (Shared)
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

import { experienceMediaSchema } from '../media/media-reference.schema'
import { experienceConfigSchema } from './experience-config.schema'

/**
 * Experience status enum schema
 * Lifecycle state of an experience
 */
export const experienceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Experience Type enum schema
 *
 * Unified type that replaces the old profile + outcome type two-step system.
 * Determines what kind of experience this is and what output it produces.
 *
 * - survey: Data collection (info, input, capture steps)
 * - photo: Passthrough photo capture with optional overlay
 * - gif: Animated GIF capture (coming soon)
 * - video: Video capture (coming soon)
 * - ai.image: AI-generated image from prompt and/or source
 * - ai.video: AI-generated video
 */
export const experienceTypeSchema = z.enum([
  'survey',
  'photo',
  'gif',
  'video',
  'ai.image',
  'ai.video',
])

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
   * Experience draft type — denormalized from draft.type for Firestore queries.
   * Updated whenever draft type changes (create, switch type).
   */
  draftType: experienceTypeSchema,

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
   * VERSIONING
   */

  /** Draft version number (starts at 1, increments on each edit) */
  draftVersion: z.number().default(1),

  /** Published version number (syncs with draftVersion on publish, null until first publish) */
  publishedVersion: z.number().nullable().default(null),

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
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type ExperienceType = z.infer<typeof experienceTypeSchema>

// Re-export media schemas for backward compatibility
export {
  experienceMediaSchema,
  type ExperienceMedia,
} from '../media/media-reference.schema'
