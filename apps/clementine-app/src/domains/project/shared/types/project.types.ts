// Project entity types
// Core project type definitions

/**
 * Project entity
 *
 * Represents a project in the Clementine platform.
 * Note: This is a minimal type for now, focused on events management.
 * Will be extended with additional fields as needed.
 */
export interface Project {
  id: string
  activeEventId: string | null
  // Additional fields will be added as features are implemented
  // e.g., name, description, workspaceId, status, createdAt, updatedAt, etc.
}
