/**
 * Hook for managing test input state with Zustand persistence
 *
 * Uses `useAIPresetPreviewStore` to persist test inputs across:
 * - Tab switches (Edit ↔ Preview)
 * - Page refreshes
 * - Multiple browser tabs
 *
 * Test inputs are keyed by preset ID, so each preset has isolated state.
 */

import { useEffect } from 'react'
import { useAIPresetPreviewStore } from '../store/useAIPresetPreviewStore'
import type { PresetVariable } from '@clementine/shared'
import type { TestInputState } from '../types'

/**
 * Manages test input state for preset preview panel with persistence.
 * Initializes with default values from variables if no stored values exist.
 *
 * @param presetId - ID of the preset being previewed
 * @param variables - Array of preset variables to initialize state from
 * @returns Test inputs state and update/reset functions
 */
export function useTestInputs(presetId: string, variables: PresetVariable[]) {
  // Get test inputs from store
  const testInputs = useAIPresetPreviewStore((state) =>
    state.getTestInputs(presetId),
  )
  const setTestInput = useAIPresetPreviewStore((state) => state.setTestInput)
  const resetTestInputs = useAIPresetPreviewStore(
    (state) => state.resetTestInputs,
  )

  // Initialize with defaults if no stored values exist
  useEffect(() => {
    const storedInputs = useAIPresetPreviewStore
      .getState()
      .getTestInputs(presetId)

    // If preset has no stored inputs, initialize with defaults
    if (Object.keys(storedInputs).length === 0 && variables.length > 0) {
      for (const variable of variables) {
        if (variable.type === 'text' && variable.defaultValue) {
          setTestInput(presetId, variable.name, variable.defaultValue)
        }
      }
    }
  }, [presetId, variables, setTestInput])

  const updateInput = (name: string, value: TestInputState[string]) => {
    setTestInput(presetId, name, value)
  }

  const resetToDefaults = () => {
    // Clear stored inputs
    resetTestInputs(presetId)

    // Set defaults (only for text variables)
    for (const variable of variables) {
      if (variable.type === 'text' && variable.defaultValue) {
        setTestInput(presetId, variable.name, variable.defaultValue)
      }
    }
  }

  return { testInputs, updateInput, resetToDefaults }
}
