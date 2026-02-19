/**
 * useOutcomeValidation Hook
 *
 * Validates per-type outcome configuration and returns validation errors.
 * Used for inline error display in the create tab form.
 *
 * Validation Rules (per-type):
 * - photo: captureStepId must reference a valid capture step
 * - ai.image: prompt required, captureStepId valid for i2i, no duplicate refMedia displayNames
 * - gif/video/ai.video: not yet supported
 *
 * @see specs/072-outcome-schema-redesign
 */
import { useMemo } from 'react'
import type { ExperienceStep, Outcome } from '@clementine/shared'

/**
 * Field-level validation error for inline display
 */
export interface FieldValidationError {
  /** Field path that has the error (e.g., 'photo.captureStepId', 'aiImage.imageGeneration.prompt') */
  field: string
  /** Human-readable error message */
  message: string
}

/**
 * Validates outcome configuration based on active type
 */
export function useOutcomeValidation(
  outcome: Outcome | null,
  steps: ExperienceStep[],
): FieldValidationError[] {
  return useMemo(() => {
    if (!outcome) return []

    const errors: FieldValidationError[] = []

    // No outcome type selected
    if (!outcome.type) {
      errors.push({
        field: 'type',
        message: 'Select an output type',
      })
      return errors
    }

    // Coming soon types
    if (
      outcome.type === 'gif' ||
      outcome.type === 'video' ||
      outcome.type === 'ai.video'
    ) {
      errors.push({
        field: 'type',
        message: `${outcome.type === 'ai.video' ? 'AI Video' : outcome.type.toUpperCase()} coming soon`,
      })
      return errors
    }

    // Photo type validation
    if (outcome.type === 'photo') {
      const config = outcome.photo
      if (!config) return errors

      // captureStepId is required for photo
      if (!config.captureStepId) {
        errors.push({
          field: 'photo.captureStepId',
          message: 'Select a source image step',
        })
      } else {
        const stepExists = steps.some(
          (s) => s.id === config.captureStepId && s.type === 'capture.photo',
        )
        if (!stepExists) {
          errors.push({
            field: 'photo.captureStepId',
            message: 'Selected source step no longer exists',
          })
        }
      }
    }

    // AI Image type validation
    if (outcome.type === 'ai.image') {
      const config = outcome.aiImage
      if (!config) return errors

      // Prompt is required
      if (!config.imageGeneration.prompt.trim()) {
        errors.push({
          field: 'aiImage.imageGeneration.prompt',
          message: 'Prompt is required',
        })
      }

      // captureStepId must be valid for image-to-image
      if (config.task === 'image-to-image') {
        if (!config.captureStepId) {
          errors.push({
            field: 'aiImage.captureStepId',
            message: 'Select a source image step for image-to-image',
          })
        } else {
          const stepExists = steps.some(
            (s) =>
              s.id === config.captureStepId && s.type === 'capture.photo',
          )
          if (!stepExists) {
            errors.push({
              field: 'aiImage.captureStepId',
              message: 'Selected source step no longer exists',
            })
          }
        }
      }

      // Duplicate displayNames in refMedia
      const displayNames = config.imageGeneration.refMedia.map(
        (m) => m.displayName,
      )
      const hasDuplicates = displayNames.length !== new Set(displayNames).size
      if (hasDuplicates) {
        errors.push({
          field: 'aiImage.imageGeneration.refMedia',
          message: 'Reference images must have unique names',
        })
      }
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
