import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Workspace store state interface
 */
interface WorkspaceStore {
  /** Last visited workspace slug (null if never visited) */
  lastVisitedWorkspaceSlug: string | null

  /** Update last visited workspace slug */
  setLastVisitedWorkspaceSlug: (slug: string) => void
}

/**
 * Zustand store for workspace session persistence
 *
 * Persists lastVisitedWorkspaceSlug to localStorage using Zustand persist middleware.
 * Gracefully handles localStorage unavailability (private browsing, quota exceeded).
 *
 * @example
 * ```tsx
 * // Set last visited workspace
 * const { setLastVisitedWorkspaceSlug } = useWorkspaceStore()
 * setLastVisitedWorkspaceSlug('acme-corp')
 *
 * // Read last visited workspace
 * const { lastVisitedWorkspaceSlug } = useWorkspaceStore()
 * ```
 */
export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      lastVisitedWorkspaceSlug: null,
      setLastVisitedWorkspaceSlug: (slug) =>
        set({ lastVisitedWorkspaceSlug: slug }),
    }),
    {
      name: 'workspace-storage',
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('Failed to rehydrate workspace state:', error)
        }
      },
    },
  ),
)
