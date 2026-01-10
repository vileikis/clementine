/**
 * Workspace Experience Schema
 *
 * Defines the structure for WorkspaceExperience documents stored in Firestore.
 * A workspace experience is a mutable experience template owned by a workspace.
 *
 * Firestore Path: /workspaces/{workspaceId}/experiences/{experienceId}
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 */
import { z } from 'zod'
import { experienceProfileSchema, experienceStatusSchema } from './experience.schema'

/**
 * Experience Media Schema
 *
 * Optional thumbnail/hero media for the experience.
 * References a MediaAsset document.
 */
export const experienceMediaSchema = z.looseObject({
  /** MediaAsset document ID */
  mediaAssetId: z.string(),

  /** Firebase Storage download URL for fast rendering */
  url: z.string().url(),
})

/**
 * Workspace Experience Schema
 *
 * Complete workspace experience document schema.
 * Contains identity, metadata, media, and steps configuration.
 */
export const workspaceExperienceSchema = z.looseObject({
  /**
   * IDENTITY
   */

  /** Unique experience identifier (Firestore document ID) */
  id: z.string(),

  /** Experience display name (1-100 characters) */
  name: z.string().min(1).max(100),

  /**
   * METADATA
   */

  /** Experience lifecycle status */
  status: experienceStatusSchema.default('active'),

  /**
   * Experience profile type
   * Determines validation rules for step sequences
   * IMMUTABLE after creation
   */
  profile: experienceProfileSchema,

  /**
   * MEDIA
   */

  /** Optional thumbnail/hero media */
  media: experienceMediaSchema.nullable().default(null),

  /**
   * STEPS
   */

  /** Ordered array of step configurations */
  steps: z.array(z.unknown()).default([]),

  /**
   * TIMESTAMPS
   */

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),

  /** Soft delete timestamp (Unix ms) */
  deletedAt: z.number().nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type WorkspaceExperience = z.infer<typeof workspaceExperienceSchema>
export type ExperienceMedia = z.infer<typeof experienceMediaSchema>
