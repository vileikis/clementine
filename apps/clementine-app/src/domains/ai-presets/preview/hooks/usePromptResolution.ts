// Hook for prompt resolution with memoization

import { useMemo } from 'react'
import { resolvePrompt } from '../lib/prompt-resolution'
import type { ResolvedPrompt, TestInputState } from '../types'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

/**
 * Resolves a prompt template with memoization to prevent unnecessary recomputation.
 * Only recomputes when dependencies change.
 *
 * @param promptTemplate - Template string with @{type:name} references
 * @param testInputs - Current test input values
 * @param variables - Array of preset variables
 * @param mediaRegistry - Array of preset media entries
 * @returns Resolved prompt with substitutions and metadata
 */
export function usePromptResolution(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[],
): ResolvedPrompt {
  return useMemo(() => {
    return resolvePrompt(promptTemplate, testInputs, variables, mediaRegistry)
  }, [promptTemplate, testInputs, variables, mediaRegistry])
}
