// Hook for preset validation with memoization

import { useMemo } from 'react'
import { validatePresetInputs } from '../lib/validation'
import type { ResolvedPrompt, TestInputState, ValidationState } from '../types'
import type { PresetVariable } from '@clementine/shared'

/**
 * Validates preset inputs with memoization to prevent unnecessary recomputation.
 * Only recomputes when dependencies change.
 *
 * @param variables - Array of preset variables
 * @param testInputs - Current test input values
 * @param resolvedPrompt - Resolved prompt with unresolved reference tracking
 * @returns Validation state with status, errors, and warnings
 */
export function usePresetValidation(
  variables: PresetVariable[],
  testInputs: TestInputState,
  resolvedPrompt: ResolvedPrompt,
): ValidationState {
  return useMemo(() => {
    return validatePresetInputs(variables, testInputs, resolvedPrompt)
  }, [variables, testInputs, resolvedPrompt])
}
