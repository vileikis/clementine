// ProjectEvent types
// Core types for project events domain

/**
 * Project event lifecycle status
 * - draft: Event is active and can be used
 * - deleted: Event is soft-deleted and hidden from all queries
 */
export type ProjectEventStatus = 'draft' | 'deleted'

/**
 * ProjectEvent entity
 * Represents an AI-powered photo booth experience within a project
 *
 * Stored in Firestore subcollection: projects/{projectId}/events/{eventId}
 * Note: projectId is implicit in the subcollection path, not stored as a field
 */
export type ProjectEvent = {
  /** Unique identifier (Firestore document ID) */
  id: string

  /** Event display name (default: "Untitled event") */
  name: string

  /** Lifecycle status */
  status: ProjectEventStatus

  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number

  /** Last update timestamp (milliseconds since epoch) */
  updatedAt: number

  /** Soft delete timestamp (null if not deleted) */
  deletedAt: number | null
}

/**
 * Input type for creating a new project event
 */
export type CreateProjectEventInput = {
  /** Event name (optional, defaults to "Untitled event") */
  name?: string
}

/**
 * Input type for updating an existing project event
 */
export type UpdateProjectEventInput = {
  /** Event ID to update */
  eventId: string
  /** New event name */
  name: string
}

/**
 * Input type for deleting a project event (soft delete)
 */
export type DeleteProjectEventInput = {
  /** Project ID (for subcollection path) */
  projectId: string
  /** Event ID to delete */
  eventId: string
}

/**
 * Input type for activating a project event
 */
export type ActivateProjectEventInput = {
  /** Project ID */
  projectId: string
  /** Event ID to activate */
  eventId: string
}

/**
 * Input type for deactivating the currently active project event
 */
export type DeactivateProjectEventInput = {
  /** Project ID */
  projectId: string
}
