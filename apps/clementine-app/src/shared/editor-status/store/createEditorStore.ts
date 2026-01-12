/**
 * Editor Store Factory
 *
 * Creates a Zustand store for tracking editor save state.
 * Each domain should create its own instance for isolation.
 *
 * @example
 * ```typescript
 * // domains/event/designer/stores/useEventDesignerStore.ts
 * import { createEditorStore } from '@/shared/editor-status'
 * export const useEventDesignerStore = createEditorStore()
 *
 * // domains/experience/designer/stores/useExperienceDesignerStore.ts
 * import { createEditorStore } from '@/shared/editor-status'
 * export const useExperienceDesignerStore = createEditorStore()
 * ```
 */
import { create } from 'zustand'

import type { EditorStore } from '../types'

/**
 * Creates a new editor store instance
 *
 * Features:
 * - Tracks pending save count
 * - Records completion timestamp for success indicator
 * - Provides reset for cleanup on unmount
 */
export function createEditorStore() {
  return create<EditorStore>((set) => ({
    pendingSaves: 0,
    lastCompletedAt: null,

    startSave: () =>
      set((state) => ({
        pendingSaves: state.pendingSaves + 1,
      })),

    completeSave: () =>
      set((state) => {
        const newCount = Math.max(0, state.pendingSaves - 1) // Defensive: prevent negative
        return {
          pendingSaves: newCount,
          lastCompletedAt: newCount === 0 ? Date.now() : state.lastCompletedAt,
        }
      }),

    resetSaveState: () =>
      set({
        pendingSaves: 0,
        lastCompletedAt: null,
      }),
  }))
}
