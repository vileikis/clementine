/**
 * Step Name Validation Hook
 *
 * Validates step names for format (Zod schema) and uniqueness within the experience.
 * Used by StepNameEditor and RenameStepDialog components.
 */
import { experienceStepNameSchema } from '@clementine/shared'

import type { ExperienceStep } from '@clementine/shared'

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Hook to validate step names
 *
 * Checks:
 * 1. Format validation (Zod schema): regex, max length, trim
 * 2. Uniqueness (case-sensitive): no duplicate names within experience
 *
 * @param stepId - ID of step being validated (excluded from uniqueness check)
 * @param steps - All steps in the experience
 * @returns Validation function that returns result with valid flag and optional error
 */
export function useValidateStepName(stepId: string, steps: ExperienceStep[]) {
  return (name: string): ValidationResult => {
    // Check format (Zod validation)
    const result = experienceStepNameSchema.safeParse(name)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return { valid: false, error: firstError?.message || 'Invalid step name' }
    }

    // Check uniqueness (case-sensitive)
    const duplicate = steps.find((s) => s.id !== stepId && s.name === name)
    if (duplicate) {
      return { valid: false, error: `Name "${name}" is already used` }
    }

    return { valid: true }
  }
}
