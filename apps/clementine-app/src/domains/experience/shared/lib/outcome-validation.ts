/**
 * Outcome Validation
 *
 * Validates per-type Outcome configuration for publishing.
 * Pure function for easy testing and reuse across publish hook and future UI.
 *
 * @see specs/072-outcome-schema-redesign
 */
import type { ExperienceStep, Outcome } from '@clementine/shared'

/**
 * Validation error returned from outcome validation.
 */
export interface OutcomeValidationError {
  /** Field path that failed validation (e.g., 'outcome.photo.captureStepId') */
  field: string
  /** User-friendly error message */
  message: string
  /** Optional step ID for step-related errors */
  stepId?: string
}

/**
 * Result of outcome validation.
 */
export interface OutcomeValidationResult {
  /** Whether the outcome configuration is valid */
  valid: boolean
  /** List of validation errors (empty if valid) */
  errors: OutcomeValidationError[]
}

/**
 * Check if a step is a capture step.
 * Capture steps have types that start with 'capture.' prefix.
 */
export function isCaptureStep(step: ExperienceStep): boolean {
  return step.type.startsWith('capture.')
}

/**
 * Validate outcome configuration for publishing.
 *
 * If outcome is null, the experience has no outcome configuration,
 * which is valid - it simply won't generate any output.
 *
 * Validation rules (per-type):
 * - V1: Type must be selected (not null)
 * - V2: Coming soon types are not yet supported
 * - V3: Photo — captureStepId required and valid
 * - V4: AI Image — prompt required, captureStepId valid for i2i, unique refMedia displayNames
 */
export function validateOutcome(
  outcome: Outcome | null,
  steps: ExperienceStep[],
): OutcomeValidationResult {
  // No outcome config = no outcome generation, which is valid
  if (!outcome) {
    return { valid: true, errors: [] }
  }

  const errors: OutcomeValidationError[] = []

  // V1: Type must be selected
  if (outcome.type === null) {
    errors.push({
      field: 'outcome.type',
      message: 'Select an output type',
    })
    return { valid: false, errors }
  }

  // V2: Coming soon types
  if (
    outcome.type === 'gif' ||
    outcome.type === 'video' ||
    outcome.type === 'ai.video'
  ) {
    errors.push({
      field: 'outcome.type',
      message: `${outcome.type === 'ai.video' ? 'AI Video' : outcome.type.toUpperCase()} output is coming soon`,
    })
    return { valid: false, errors }
  }

  // V3: Photo type validation
  if (outcome.type === 'photo') {
    const config = outcome.photo
    if (!config) {
      errors.push({
        field: 'outcome.photo',
        message: 'Photo configuration is missing',
      })
    } else {
      if (!config.captureStepId) {
        errors.push({
          field: 'outcome.photo.captureStepId',
          message: 'Select a source image step for photo output',
        })
      } else {
        const step = steps.find((s) => s.id === config.captureStepId)
        if (!step) {
          errors.push({
            field: 'outcome.photo.captureStepId',
            message: 'Selected source step no longer exists',
            stepId: config.captureStepId,
          })
        } else if (!isCaptureStep(step)) {
          errors.push({
            field: 'outcome.photo.captureStepId',
            message: 'Source step must be a capture step',
            stepId: config.captureStepId,
          })
        }
      }
    }
  }

  // V4: AI Image type validation
  if (outcome.type === 'ai.image') {
    const config = outcome.aiImage
    if (!config) {
      errors.push({
        field: 'outcome.aiImage',
        message: 'AI Image configuration is missing',
      })
    } else {
      // Prompt required
      if (!config.imageGeneration.prompt?.trim()) {
        errors.push({
          field: 'outcome.aiImage.imageGeneration.prompt',
          message: 'Prompt is required for AI Image output',
        })
      }

      // captureStepId validation for image-to-image
      if (config.task === 'image-to-image') {
        if (!config.captureStepId) {
          errors.push({
            field: 'outcome.aiImage.captureStepId',
            message: 'Select a source image step for image-to-image',
          })
        } else {
          const step = steps.find((s) => s.id === config.captureStepId)
          if (!step) {
            errors.push({
              field: 'outcome.aiImage.captureStepId',
              message: 'Selected source step no longer exists',
              stepId: config.captureStepId,
            })
          } else if (!isCaptureStep(step)) {
            errors.push({
              field: 'outcome.aiImage.captureStepId',
              message: 'Source step must be a capture step',
              stepId: config.captureStepId,
            })
          }
        }
      }

      // Unique refMedia displayNames
      const refMedia = config.imageGeneration.refMedia ?? []
      const displayNames = refMedia.map((r) => r.displayName)
      const duplicates = displayNames.filter(
        (name, index) => displayNames.indexOf(name) !== index,
      )
      if (duplicates.length > 0) {
        const uniqueDuplicates = [...new Set(duplicates)]
        errors.push({
          field: 'outcome.aiImage.imageGeneration.refMedia',
          message: `Duplicate reference media names: ${uniqueDuplicates.join(', ')}`,
        })
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
