/**
 * Create Outcome Validation
 *
 * Validates CreateOutcome configuration for publishing.
 * Pure function for easy testing and reuse across publish hook and future UI.
 *
 * @see PRD 1C - Experience Create Outcome Configuration
 */
import type { CreateOutcome, ExperienceStep } from '@clementine/shared'

/**
 * Validation error returned from create outcome validation.
 */
export interface CreateOutcomeValidationError {
  /** Field path that failed validation (e.g., 'create.type') */
  field: string
  /** User-friendly error message */
  message: string
  /** Optional step ID for step-related errors */
  stepId?: string
}

/**
 * Result of create outcome validation.
 */
export interface CreateOutcomeValidationResult {
  /** Whether the create outcome configuration is valid */
  valid: boolean
  /** List of validation errors (empty if valid) */
  errors: CreateOutcomeValidationError[]
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
 * Validate create outcome configuration for publishing.
 *
 * If create is null, the experience has no outcome configuration,
 * which is valid - it simply won't generate any output.
 *
 * Validation rules (executed in order, only if create is configured):
 * - V1: Type must be selected (not null)
 * - V2: Passthrough mode requires a capture step source
 * - V3: CaptureStepId must reference an existing step
 * - V4: CaptureStepId must reference a capture-type step
 * - V5: AI enabled requires a non-empty prompt
 * - V6: RefMedia displayNames must be unique
 * - V7: GIF/Video types are not yet supported
 * - V8: Options kind must match outcome type
 *
 * @param create - Create outcome configuration to validate (null means no outcome)
 * @param steps - Experience steps for captureStepId validation
 * @returns Validation result with errors list
 */
export function validateCreateOutcome(
  create: CreateOutcome | null,
  steps: ExperienceStep[],
): CreateOutcomeValidationResult {
  // No create config = no outcome generation, which is valid
  if (!create) {
    return { valid: true, errors: [] }
  }

  const errors: CreateOutcomeValidationError[] = []

  // V1: Type must be selected
  if (create.type === null) {
    errors.push({
      field: 'create.type',
      message: 'Select an outcome type (Image, GIF, or Video)',
    })
    // Early return - no point validating further without a type
    return { valid: false, errors }
  }

  // V2: Passthrough mode requires a capture step source
  if (!create.aiEnabled && !create.captureStepId) {
    errors.push({
      field: 'create.captureStepId',
      message:
        'Passthrough mode requires a source image. Select a capture step or enable AI generation.',
    })
  }

  // V3 & V4: Validate captureStepId if set
  if (create.captureStepId) {
    const step = steps.find((s) => s.id === create.captureStepId)

    if (!step) {
      // V3: Step not found
      errors.push({
        field: 'create.captureStepId',
        message: 'Selected source step no longer exists',
        stepId: create.captureStepId,
      })
    } else if (!isCaptureStep(step)) {
      // V4: Step is not a capture type
      errors.push({
        field: 'create.captureStepId',
        message: 'Source step must be a capture step',
        stepId: create.captureStepId,
      })
    }
  }

  // V5: AI enabled requires a non-empty prompt
  if (create.aiEnabled && !create.imageGeneration.prompt.trim()) {
    errors.push({
      field: 'create.imageGeneration.prompt',
      message: 'Prompt is required when AI is enabled',
    })
  }

  // V6: RefMedia displayNames must be unique
  const displayNames = create.imageGeneration.refMedia.map((r) => r.displayName)
  const duplicates = displayNames.filter(
    (name, index) => displayNames.indexOf(name) !== index,
  )
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)]
    errors.push({
      field: 'create.imageGeneration.refMedia',
      message: `Duplicate reference media names: ${uniqueDuplicates.join(', ')}`,
    })
  }

  // V7: GIF/Video types are not yet supported
  if (create.type === 'gif' || create.type === 'video') {
    errors.push({
      field: 'create.type',
      message: `${create.type.toUpperCase()} outcome is coming soon`,
    })
  }

  // V8: Options kind must match outcome type
  if (create.options && create.options.kind !== create.type) {
    errors.push({
      field: 'create.options',
      message: 'Options kind must match outcome type',
    })
  }

  return { valid: errors.length === 0, errors }
}
