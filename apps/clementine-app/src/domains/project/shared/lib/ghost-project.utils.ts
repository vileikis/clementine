/**
 * Ghost Project Utilities
 *
 * Utilities for working with ghost projects used for preview sessions.
 * Ghost projects are system-managed and never displayed in project lists.
 *
 * Ghost Project ID format: `ghost_{workspaceId}`
 * Ghost Project Path: `/projects/ghost_{workspaceId}/sessions/{sessionId}`
 */

/**
 * Generate deterministic ghost project ID from workspace ID
 * @param workspaceId - The workspace ID
 * @returns Ghost project ID in format `ghost_{workspaceId}`
 */
export function getGhostProjectId(workspaceId: string): string {
  return `ghost_${workspaceId}`
}

/**
 * Check if a project ID is a ghost project
 * @param projectId - The project ID to check
 * @returns True if the project ID matches ghost project pattern
 */
export function isGhostProjectId(projectId: string): boolean {
  return projectId.startsWith('ghost_')
}
