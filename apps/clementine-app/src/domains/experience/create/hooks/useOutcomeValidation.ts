/**
 * useOutcomeValidation Hook
 *
 * Validates outcome configuration and returns validation errors.
 * Used for publish-time validation with inline error display.
 *
 * Validation Rules:
 * - No outcome type → "Select an outcome type"
 * - Passthrough (AI disabled) without source → "Passthrough mode requires a source image"
 * - AI enabled without prompt → "Prompt is required"
 * - Invalid captureStepId → "Selected source step no longer exists"
 * - Duplicate displayNames → "Reference images must have unique names"
 * - GIF/Video selected → "GIF/Video coming soon" (disabled in UI, but validated as fallback)
 *
 * @see spec.md - US6 (Validate and Publish)
 */
import { useMemo } from 'react'
import type { ExperienceStep, Outcome } from '@clementine/shared'

/**
 * Field-level validation error for inline display
 */
export interface FieldValidationError {
  /** Field path that has the error (e.g., 'type', 'prompt', 'captureStepId') */
  field: string
  /** Human-readable error message */
  message: string
}

/**
 * Validates outcome configuration
 *
 * @param outcome - Outcome configuration to validate (null = not configured)
 * @param steps - Experience steps for validating captureStepId references
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```tsx
 * function CreateTabForm({ experience }) {
 *   const errors = useOutcomeValidation(
 *     experience.draft.outcome,
 *     experience.draft.steps
 *   )
 *
 *   const hasErrors = errors.length > 0
 *   const promptError = errors.find(e => e.field === 'prompt')
 * }
 * ```
 */
export function useOutcomeValidation(
  outcome: Outcome | null,
  steps: ExperienceStep[],
): FieldValidationError[] {
  return useMemo(() => {
    // No outcome = no validation errors (form is empty)
    if (!outcome) return []

    const errors: FieldValidationError[] = []

    // No outcome type selected
    if (!outcome.type) {
      errors.push({
        field: 'type',
        message: 'Select an outcome type',
      })
    }

    // GIF/Video not yet supported (fallback validation - UI should prevent this)
    if (outcome.type === 'gif' || outcome.type === 'video') {
      errors.push({
        field: 'type',
        message: `${outcome.type.toUpperCase()} coming soon`,
      })
    }

    // Passthrough mode (AI disabled) requires a source image
    if (!outcome.aiEnabled && !outcome.captureStepId) {
      errors.push({
        field: 'captureStepId',
        message: 'Passthrough mode requires a source image',
      })
    }

    // AI enabled requires a prompt
    if (outcome.aiEnabled && outcome.imageGeneration.prompt.trim() === '') {
      errors.push({
        field: 'prompt',
        message: 'Prompt is required',
      })
    }

    // Validate captureStepId references an existing capture step
    if (outcome.captureStepId) {
      const stepExists = steps.some(
        (s) => s.id === outcome.captureStepId && s.type === 'capture.photo',
      )
      if (!stepExists) {
        errors.push({
          field: 'captureStepId',
          message: 'Selected source step no longer exists',
        })
      }
    }

    // Check for duplicate displayNames in reference media
    const displayNames = outcome.imageGeneration.refMedia.map(
      (m) => m.displayName,
    )
    const hasDuplicates = displayNames.length !== new Set(displayNames).size
    if (hasDuplicates) {
      errors.push({
        field: 'refMedia',
        message: 'Reference images must have unique names',
      })
    }

    return errors
  }, [outcome, steps])
}

/**
 * Helper to check if a specific field has an error
 */
export function hasFieldError(
  errors: FieldValidationError[],
  field: string,
): boolean {
  return errors.some((e) => e.field === field)
}

/**
 * Helper to get error message for a specific field
 */
export function getFieldError(
  errors: FieldValidationError[],
  field: string,
): string | undefined {
  return errors.find((e) => e.field === field)?.message
}
