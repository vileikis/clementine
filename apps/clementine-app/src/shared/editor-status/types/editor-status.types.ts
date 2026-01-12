/**
 * Editor Status Types
 *
 * Shared types for editor status tracking across domains.
 */

/**
 * Editor store state and actions
 */
export interface EditorStore {
  /** Number of save operations currently in progress */
  pendingSaves: number
  /** Timestamp when all saves completed (for showing success indicator) */
  lastCompletedAt: number | null
  /** Call when starting a save operation */
  startSave: () => void
  /** Call when a save operation completes */
  completeSave: () => void
  /** Reset all save state (call on unmount) */
  resetSaveState: () => void
}

/**
 * Props for version-based change detection
 */
export interface VersionInfo {
  /** Current draft version number */
  draftVersion: number | null
  /** Last published version number */
  publishedVersion: number | null
}
