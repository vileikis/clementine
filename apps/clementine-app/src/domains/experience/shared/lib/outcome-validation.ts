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

const COMING_SOON_TYPES = new Set(['gif', 'video'])

// ── Shared helpers ──────────────────────────────────────────

/**
 * Check if a step is a capture step.
 * Capture steps have types that start with 'capture.' prefix.
 */
export function isCaptureStep(step: ExperienceStep): boolean {
  return step.type.startsWith('capture.')
}

/**
 * Validate that a captureStepId references an existing capture step.
 * Returns an error if invalid, undefined if valid.
 */
function validateCaptureStepId(
  captureStepId: string,
  steps: ExperienceStep[],
  fieldPrefix: string,
): OutcomeValidationError | undefined {
  if (!captureStepId) {
    return {
      field: `${fieldPrefix}.captureStepId`,
      message: `Select a source image step`,
    }
  }

  const step = steps.find((s) => s.id === captureStepId)

  if (!step) {
    return {
      field: `${fieldPrefix}.captureStepId`,
      message: 'Selected source step no longer exists',
      stepId: captureStepId,
    }
  }

  if (!isCaptureStep(step)) {
    return {
      field: `${fieldPrefix}.captureStepId`,
      message: 'Source step must be a capture step',
      stepId: captureStepId,
    }
  }

  return undefined
}

/**
 * Find duplicate displayNames in a refMedia array.
 * Returns an error if duplicates found, undefined otherwise.
 */
function validateRefMediaDisplayNames(
  refMedia: { displayName: string }[],
  field: string,
): OutcomeValidationError | undefined {
  const displayNames = refMedia.map((r) => r.displayName)
  const duplicates = displayNames.filter(
    (name, index) => displayNames.indexOf(name) !== index,
  )

  if (duplicates.length === 0) return undefined

  return {
    field,
    message: `Duplicate reference media names: ${[...new Set(duplicates)].join(', ')}`,
  }
}

// ── Per-type validators ─────────────────────────────────────

function validatePhoto(
  outcome: Outcome,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const config = outcome.photo
  if (!config) {
    return [{ field: 'outcome.photo', message: 'Photo configuration is missing' }]
  }

  const error = validateCaptureStepId(config.captureStepId, steps, 'outcome.photo')
  return error ? [error] : []
}

function validateAiImage(
  outcome: Outcome,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const config = outcome.aiImage
  if (!config) {
    return [{ field: 'outcome.aiImage', message: 'AI Image configuration is missing' }]
  }

  const errors: OutcomeValidationError[] = []

  if (!config.imageGeneration.prompt?.trim()) {
    errors.push({
      field: 'outcome.aiImage.imageGeneration.prompt',
      message: 'Prompt is required for AI Image output',
    })
  }

  if (config.task === 'image-to-image') {
    const stepError = validateCaptureStepId(
      config.captureStepId ?? '',
      steps,
      'outcome.aiImage',
    )
    if (stepError) errors.push(stepError)
  }

  const refError = validateRefMediaDisplayNames(
    config.imageGeneration.refMedia ?? [],
    'outcome.aiImage.imageGeneration.refMedia',
  )
  if (refError) errors.push(refError)

  return errors
}

function validateAiVideo(
  outcome: Outcome,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const config = outcome.aiVideo
  if (!config) {
    return [{ field: 'outcome.aiVideo', message: 'AI Video configuration is missing' }]
  }

  const errors: OutcomeValidationError[] = []

  const stepError = validateCaptureStepId(config.captureStepId, steps, 'outcome.aiVideo')
  if (stepError) errors.push(stepError)

  if (config.startFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      config.startFrameImageGen.refMedia ?? [],
      'outcome.aiVideo.startFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  if (config.endFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      config.endFrameImageGen.refMedia ?? [],
      'outcome.aiVideo.endFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  return errors
}

// ── Main validator ──────────────────────────────────────────

const typeValidators: Record<
  string,
  (outcome: Outcome, steps: ExperienceStep[]) => OutcomeValidationError[]
> = {
  photo: validatePhoto,
  'ai.image': validateAiImage,
  'ai.video': validateAiVideo,
}

/**
 * Validate outcome configuration for publishing.
 *
 * Returns valid if outcome is null (no outcome = no generation).
 */
export function validateOutcome(
  outcome: Outcome | null,
  steps: ExperienceStep[],
): OutcomeValidationResult {
  if (!outcome) return { valid: true, errors: [] }

  if (outcome.type === null) {
    return {
      valid: false,
      errors: [{ field: 'outcome.type', message: 'Select an output type' }],
    }
  }

  if (COMING_SOON_TYPES.has(outcome.type)) {
    return {
      valid: false,
      errors: [
        {
          field: 'outcome.type',
          message: `${outcome.type.toUpperCase()} output is coming soon`,
        },
      ],
    }
  }

  const validator = typeValidators[outcome.type]
  const errors = validator ? validator(outcome, steps) : []

  return { valid: errors.length === 0, errors }
}
