/**
 * AI Preset Preview Store
 *
 * Zustand store with localStorage persistence for preview panel state.
 * Stores test input values per preset to preserve state across:
 * - Tab switches (Edit ↔ Preview)
 * - Page refreshes
 * - Multiple browser tabs
 *
 * Features:
 * - Per-preset isolation (presets don't conflict)
 * - TTL cleanup (removes entries older than 30 days)
 * - Max entries limit (keeps 100 most recent presets)
 * - Auto-cleanup on app load
 *
 * Note: Only text inputs persist. File objects (images) cannot be
 * serialized to localStorage and are lost on page refresh.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TestInputState } from '../types'

/**
 * Preset entry with timestamp for TTL cleanup
 */
interface PresetEntry {
  testInputs: TestInputState
  lastUpdated: number
}

/**
 * Preview store state
 */
interface PreviewState {
  /**
   * Test inputs keyed by preset ID
   */
  presets: Record<string, PresetEntry>

  /**
   * Set a test input value for a specific preset
   * @param value - Text string for text variables, MediaReference for image variables, null for empty
   */
  setTestInput: (
    presetId: string,
    name: string,
    value: TestInputState[string],
  ) => void

  /**
   * Reset all test inputs for a specific preset (back to empty)
   */
  resetTestInputs: (presetId: string) => void

  /**
   * Get test inputs for a specific preset
   */
  getTestInputs: (presetId: string) => TestInputState

  /**
   * Manually trigger cleanup of old entries
   */
  cleanupOldPresets: () => void
}

// Cleanup constants
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const MAX_ENTRIES = 100 // Keep 100 most recent presets

/**
 * Cleanup old and excess entries
 *
 * Strategy:
 * 1. Remove entries older than 30 days
 * 2. If still > 100 entries, keep 100 most recent
 *
 * @param presets - Current presets dictionary
 * @returns Cleaned presets dictionary
 */
function cleanupEntries(
  presets: Record<string, PresetEntry>,
): Record<string, PresetEntry> {
  const now = Date.now()

  // Remove old entries (30+ days)
  let entries = Object.entries(presets).filter(
    ([_, entry]) => now - entry.lastUpdated < MAX_AGE_MS,
  )

  // Limit to max entries (keep most recent)
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => b[1].lastUpdated - a[1].lastUpdated)
    entries = entries.slice(0, MAX_ENTRIES)
  }

  return Object.fromEntries(entries)
}

/**
 * AI Preset Preview Store
 *
 * Persists test input values per preset to localStorage.
 * Automatically cleans up old entries on app load.
 *
 * @example
 * ```tsx
 * // Get test inputs for current preset
 * const testInputs = useAIPresetPreviewStore((state) =>
 *   state.getTestInputs(presetId)
 * )
 *
 * // Update a test input
 * const setTestInput = useAIPresetPreviewStore((state) => state.setTestInput)
 * setTestInput(presetId, 'style', 'dramatic')
 *
 * // Reset all inputs
 * const resetTestInputs = useAIPresetPreviewStore((state) => state.resetTestInputs)
 * resetTestInputs(presetId)
 * ```
 */
export const useAIPresetPreviewStore = create<PreviewState>()(
  persist(
    (set, get) => ({
      presets: {},

      setTestInput: (presetId, name, value) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [presetId]: {
              testInputs: {
                ...(state.presets[presetId]?.testInputs || {}),
                [name]: value,
              },
              lastUpdated: Date.now(),
            },
          },
        })),

      resetTestInputs: (presetId) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [presetId]: {
              testInputs: {},
              lastUpdated: Date.now(),
            },
          },
        })),

      getTestInputs: (presetId) => get().presets[presetId]?.testInputs || {},

      cleanupOldPresets: () =>
        set((state) => ({
          presets: cleanupEntries(state.presets),
        })),
    }),
    {
      name: 'ai-preset-preview-storage',

      // Auto-cleanup on app load (rehydrate from localStorage)
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.presets = cleanupEntries(state.presets)
        }
      },
    },
  ),
)
