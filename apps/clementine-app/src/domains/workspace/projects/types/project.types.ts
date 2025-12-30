/**
 * Project lifecycle state
 * - draft: Project is being configured, not yet live
 * - live: Project is active and accessible to guests
 * - deleted: Project is soft-deleted (hidden from lists, inaccessible)
 */
export type ProjectStatus = 'draft' | 'live' | 'deleted'

/**
 * Project entity representing a photo/video experience
 */
export interface Project {
  /** Unique project identifier (Firestore document ID) */
  id: string

  /** Human-readable project name (1-100 characters) */
  name: string

  /** Reference to parent workspace (workspaceId) */
  workspaceId: string

  /** Current lifecycle state (draft | live | deleted) */
  status: ProjectStatus

  /** Reference to currently active event (null if no active event) */
  activeEventId: string | null

  /** Unix timestamp (ms) when project was soft deleted (null if active) */
  deletedAt: number | null

  /** Unix timestamp (ms) when project was created */
  createdAt: number

  /** Unix timestamp (ms) of last modification */
  updatedAt: number
}

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  /** Parent workspace ID */
  workspaceId: string

  /** Optional custom name (defaults to "Untitled project") */
  name?: string
}

/**
 * Input data for deleting a project
 */
export interface DeleteProjectInput {
  /** Project ID to delete */
  id: string
}
