// Hook for managing test input state

import { useState } from 'react'
import type { TestInputState } from '../types'
import type { PresetVariable } from '@clementine/shared'

/**
 * Manages test input state for preset preview panel.
 * Initializes with default values from variables and provides update/reset functions.
 *
 * @param variables - Array of preset variables to initialize state from
 * @returns Test inputs state and update/reset functions
 */
export function useTestInputs(variables: PresetVariable[]) {
  const [testInputs, setTestInputs] = useState<TestInputState>(() => {
    // Initialize with default values
    const initialState: TestInputState = {}
    for (const variable of variables) {
      initialState[variable.name] = variable.defaultValue || null
    }
    return initialState
  })

  const updateInput = (name: string, value: string | File | null) => {
    setTestInputs((prev) => ({ ...prev, [name]: value }))
  }

  const resetToDefaults = () => {
    const resetState: TestInputState = {}
    for (const variable of variables) {
      resetState[variable.name] = variable.defaultValue || null
    }
    setTestInputs(resetState)
  }

  return { testInputs, updateInput, resetToDefaults }
}
