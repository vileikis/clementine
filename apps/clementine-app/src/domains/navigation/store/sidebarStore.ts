import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  // Persisted state
  isCollapsed: boolean

  // Non-persisted state (mobile sheet should always start closed)
  isMobileOpen: boolean

  // Actions
  toggleCollapsed: () => void
  toggleMobileOpen: () => void
  closeMobile: () => void
}

/**
 * Sidebar state store with Zustand
 *
 * Features:
 * - Persists `isCollapsed` state to localStorage
 * - `isMobileOpen` is not persisted (mobile sheet always starts closed)
 * - Provides toggle and close actions
 *
 * @example
 * ```tsx
 * const { isCollapsed, toggleCollapsed } = useSidebarStore()
 * ```
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Initial state
      isCollapsed: false,
      isMobileOpen: false,

      // Actions
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMobileOpen: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'sidebar-storage', // localStorage key
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Only persist isCollapsed
    },
  ),
)
