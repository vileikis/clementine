// Validation utilities for AI Preset Preview

import type { ResolvedPrompt, TestInputState, ValidationState } from '../types'
import type { PresetVariable } from '@clementine/shared'

/**
 * Validates preset inputs by checking for missing required values
 * and undefined references in the resolved prompt.
 *
 * @param variables - Array of preset variables with requirements
 * @param testInputs - Current test input values
 * @param resolvedPrompt - Resolved prompt with unresolved reference tracking
 * @returns Validation state with status, errors, and warnings
 */
export function validatePresetInputs(
  variables: PresetVariable[],
  testInputs: TestInputState,
  resolvedPrompt: ResolvedPrompt,
): ValidationState {
  const errors: ValidationState['errors'] = []
  const warnings: ValidationState['warnings'] = []

  // Check for missing required inputs
  for (const variable of variables) {
    const inputValue = testInputs[variable.name]

    // Image variables must have a file
    if (variable.type === 'image' && !inputValue) {
      errors.push({
        field: variable.name,
        message: `Image required for: ${variable.name}`,
      })
    }

    // Text variables with no default and no input
    if (variable.type === 'text' && !inputValue && !variable.defaultValue) {
      errors.push({
        field: variable.name,
        message: `Value required for: ${variable.name}`,
      })
    }
  }

  // Check for unresolved references
  for (const ref of resolvedPrompt.unresolvedRefs) {
    if (ref.type === 'text' || ref.type === 'input') {
      warnings.push({
        type: 'undefined-variable',
        message: `Undefined variable: @{${ref.type}:${ref.name}}`,
        reference: ref.name,
      })
    }
    if (ref.type === 'ref') {
      warnings.push({
        type: 'undefined-media',
        message: `Undefined media: @{ref:${ref.name}}`,
        reference: ref.name,
      })
    }
  }

  // Determine overall status
  let status: ValidationState['status']
  if (errors.length > 0) {
    status = 'incomplete'
  } else if (warnings.length > 0) {
    status = 'invalid'
  } else {
    status = 'valid'
  }

  return { status, errors, warnings }
}
