/**
 * Re-export core Project types from shared schema
 * These are the canonical type definitions derived from Zod schemas
 */
export type { Project, ProjectStatus, ProjectType } from '@clementine/shared'

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  /** Parent workspace ID */
  workspaceId: string

  /** Workspace slug for navigation after creation */
  workspaceSlug: string

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

/**
 * Input data for renaming a project
 */
export interface RenameProjectInput {
  /** Project ID to rename */
  projectId: string

  /** New project name (1-100 characters) */
  name: string
}

/**
 * Input data for updating project fields
 */
export interface UpdateProjectInput {
  /** New project name (1-100 characters) */
  name: string
}
