/**
 * Workspace lifecycle state
 * - active: Workspace is accessible and visible in lists
 * - deleted: Workspace is soft-deleted (hidden from lists, slug unavailable for reuse)
 */
export type WorkspaceStatus = 'active' | 'deleted'

/**
 * Workspace entity representing an organizational unit
 */
export interface Workspace {
  /** Unique workspace identifier (Firestore document ID) */
  id: string

  /** Human-readable workspace name (1-100 characters) */
  name: string

  /** URL-safe unique identifier (1-50 characters, lowercase, alphanumeric + hyphens) */
  slug: string

  /** Current lifecycle state (active | deleted) */
  status: WorkspaceStatus

  /** Unix timestamp (ms) when workspace was soft deleted (null if active) */
  deletedAt: number | null

  /** Unix timestamp (ms) when workspace was created */
  createdAt: number

  /** Unix timestamp (ms) of last modification */
  updatedAt: number
}

/**
 * Input data for creating a new workspace
 */
export interface CreateWorkspaceInput {
  /** Human-readable workspace name (1-100 characters) */
  name: string

  /** Optional custom slug (auto-generated from name if not provided) */
  slug?: string
}

/**
 * Input data for deleting a workspace
 */
export interface DeleteWorkspaceInput {
  /** Workspace ID to delete */
  id: string
}
