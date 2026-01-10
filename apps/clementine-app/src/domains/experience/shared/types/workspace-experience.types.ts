/**
 * Workspace Experience Types
 *
 * TypeScript types for workspace experience CRUD operations.
 */
import type { ExperienceMedia, ExperienceProfile } from '../schemas'

/**
 * Input for creating a new workspace experience
 *
 * Required fields:
 * - name: Display name (1-100 characters)
 * - profile: Experience profile type (immutable after creation)
 *
 * Optional fields:
 * - media: Thumbnail/hero media reference
 * - steps: Initial step configurations
 */
export interface CreateExperienceInput {
  /** Workspace ID where experience will be created */
  workspaceId: string

  /** Experience display name (1-100 characters) */
  name: string

  /** Experience profile type - determines allowed step types */
  profile: ExperienceProfile

  /** Optional thumbnail/hero media */
  media?: ExperienceMedia | null

  /** Optional initial steps configuration */
  steps?: unknown[]
}

/**
 * Input for updating an existing workspace experience
 *
 * Note: `profile` cannot be updated (immutable after creation)
 */
export interface UpdateExperienceInput {
  /** Workspace ID containing the experience */
  workspaceId: string

  /** Experience ID to update */
  experienceId: string

  /** Fields to update */
  updates: {
    /** Updated display name (1-100 characters) */
    name?: string

    /** Updated media reference */
    media?: ExperienceMedia | null

    /** Updated steps configuration */
    steps?: unknown[]
  }
}

/**
 * Input for deleting (soft-delete) a workspace experience
 */
export interface DeleteExperienceInput {
  /** Workspace ID containing the experience */
  workspaceId: string

  /** Experience ID to delete */
  experienceId: string
}

/**
 * Result of experience creation
 */
export interface CreateExperienceResult {
  /** Created experience ID */
  experienceId: string

  /** Workspace ID where experience was created */
  workspaceId: string
}
