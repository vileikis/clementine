import { create } from 'zustand'

interface EventDesignerStore {
  pendingSaves: number
  lastCompletedAt: number | null
  startSave: () => void
  completeSave: () => void
  resetSaveState: () => void
}

export const useEventDesignerStore = create<EventDesignerStore>((set) => ({
  pendingSaves: 0,
  lastCompletedAt: null,

  startSave: () =>
    set((state) => ({
      pendingSaves: state.pendingSaves + 1,
    })),

  completeSave: () =>
    set((state) => {
      const newCount = Math.max(0, state.pendingSaves - 1) // Defensive check: prevent negative
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
