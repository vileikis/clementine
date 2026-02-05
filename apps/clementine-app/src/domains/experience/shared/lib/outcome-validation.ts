/**
 * Outcome Validation
 *
 * Validates Outcome configuration for publishing.
 * Pure function for easy testing and reuse across publish hook and future UI.
 *
 * @see PRD 1C - Experience Outcome Configuration
 */
import type { Outcome, ExperienceStep } from '@clementine/shared'

/**
 * Validation error returned from outcome validation.
 */
export interface OutcomeValidationError {
  /** Field path that failed validation (e.g., 'outcome.type') */
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
 *
 * @param step - Experience step to check
 * @returns true if the step is a capture step
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
 * Validation rules (executed in order, only if outcome is configured):
 * - V1: Type must be selected (not null)
 * - V2: Passthrough mode requires a capture step source
 * - V3: CaptureStepId must reference an existing step
 * - V4: CaptureStepId must reference a capture-type step
 * - V5: AI enabled requires a non-empty prompt
 * - V6: RefMedia displayNames must be unique
 * - V7: GIF/Video types are not yet supported
 * - V8: Options kind must match outcome type
 *
 * @param outcome - Outcome configuration to validate (null means no outcome)
 * @param steps - Experience steps for captureStepId validation
 * @returns Validation result with errors list
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
      message: 'Select an outcome type (Image, GIF, or Video)',
    })
    // Early return - no point validating further without a type
    return { valid: false, errors }
  }

  // V2: Passthrough mode requires a capture step source
  if (!outcome.aiEnabled && !outcome.captureStepId) {
    errors.push({
      field: 'outcome.captureStepId',
      message:
        'Passthrough mode requires a source image. Select a capture step or enable AI generation.',
    })
  }

  // V3 & V4: Validate captureStepId if set
  if (outcome.captureStepId) {
    const step = steps.find((s) => s.id === outcome.captureStepId)

    if (!step) {
      // V3: Step not found
      errors.push({
        field: 'outcome.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: outcome.captureStepId,
      })
    } else if (!isCaptureStep(step)) {
      // V4: Step is not a capture type
      errors.push({
        field: 'outcome.captureStepId',
        message: 'Source step must be a capture step',
        stepId: outcome.captureStepId,
      })
    }
  }

  // V5: AI enabled requires imageGeneration with a non-empty prompt
  if (outcome.aiEnabled) {
    if (!outcome.imageGeneration) {
      errors.push({
        field: 'outcome.imageGeneration',
        message:
          'AI configuration is missing. Please configure AI generation settings.',
      })
    } else if (!outcome.imageGeneration.prompt?.trim()) {
      errors.push({
        field: 'outcome.imageGeneration.prompt',
        message: 'Prompt is required when AI is enabled',
      })
    }
  }

  // V6: RefMedia displayNames must be unique
  const refMedia = outcome.imageGeneration?.refMedia ?? []
  const displayNames = refMedia.map((r) => r.displayName)
  const duplicates = displayNames.filter(
    (name, index) => displayNames.indexOf(name) !== index,
  )
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)]
    errors.push({
      field: 'outcome.imageGeneration.refMedia',
      message: `Duplicate reference media names: ${uniqueDuplicates.join(', ')}`,
    })
  }

  // V7: GIF/Video types are not yet supported
  if (outcome.type === 'gif' || outcome.type === 'video') {
    errors.push({
      field: 'outcome.type',
      message: `${outcome.type.toUpperCase()} outcome is coming soon`,
    })
  }

  // V8: Options kind must match outcome type
  if (outcome.options && outcome.options.kind !== outcome.type) {
    errors.push({
      field: 'outcome.options',
      message: 'Options kind must match outcome type',
    })
  }

  return { valid: errors.length === 0, errors }
}
