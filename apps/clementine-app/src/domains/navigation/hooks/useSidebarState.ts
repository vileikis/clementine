import { useSidebarStore } from '../store/sidebarStore'

/**
 * Hook to access sidebar state and actions
 *
 * Wraps the Zustand store for easier consumption
 * The `isCollapsed` state is persisted to localStorage
 */
export function useSidebarState() {
  return useSidebarStore()
}
