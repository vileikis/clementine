'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ViewportStore } from '../types/preview-shell.types'

/**
 * Global viewport mode store with localStorage persistence
 *
 * Synchronizes viewport state across all PreviewShell instances
 * Persists user's viewport preference across page refreshes
 */
export const useViewportStore = create<ViewportStore>()(
  persist(
    (set) => ({
      mode: 'mobile',
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((state) => ({
          mode: state.mode === 'mobile' ? 'desktop' : 'mobile',
        })),
    }),
    {
      name: 'preview-viewport',
    },
  ),
)
