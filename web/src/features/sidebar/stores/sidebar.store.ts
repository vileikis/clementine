'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SidebarStore } from '../types';

/**
 * Sidebar state management with localStorage persistence.
 * Handles collapse state and last visited company slug.
 */
export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      // State
      isCollapsed: false,
      lastCompanySlug: null,

      // Actions
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setLastCompanySlug: (slug) => set({ lastCompanySlug: slug }),
      clearLastCompanySlug: () => set({ lastCompanySlug: null }),
    }),
    {
      name: 'clementine-sidebar',
    }
  )
);
