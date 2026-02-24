/**
 * Outcome Validation
 *
 * Validates per-type experience configuration for publishing.
 * Pure function for easy testing and reuse across publish hook and future UI.
 *
 * @see specs/081-experience-type-flattening
 */
import type {
  ExperienceConfig,
  ExperienceStep,
  ExperienceType,
} from '@clementine/shared'

/**
 * Validation error returned from outcome validation.
 */
export interface OutcomeValidationError {
  /** Field path that failed validation (e.g., 'photo.captureStepId') */
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
  config: ExperienceConfig,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const typeConfig = config.photo
  if (!typeConfig) {
    return [{ field: 'photo', message: 'Photo configuration is missing' }]
  }

  const error = validateCaptureStepId(typeConfig.captureStepId, steps, 'photo')
  return error ? [error] : []
}

function validateAiImage(
  config: ExperienceConfig,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const typeConfig = config.aiImage
  if (!typeConfig) {
    return [
      {
        field: 'aiImage',
        message: 'AI Image configuration is missing',
      },
    ]
  }

  const errors: OutcomeValidationError[] = []

  if (!typeConfig.imageGeneration.prompt?.trim()) {
    errors.push({
      field: 'aiImage.imageGeneration.prompt',
      message: 'Prompt is required for AI Image output',
    })
  }

  if (typeConfig.task === 'image-to-image') {
    const stepError = validateCaptureStepId(
      typeConfig.captureStepId ?? '',
      steps,
      'aiImage',
    )
    if (stepError) errors.push(stepError)
  }

  const refError = validateRefMediaDisplayNames(
    typeConfig.imageGeneration.refMedia ?? [],
    'aiImage.imageGeneration.refMedia',
  )
  if (refError) errors.push(refError)

  return errors
}

function validateAiVideo(
  config: ExperienceConfig,
  steps: ExperienceStep[],
): OutcomeValidationError[] {
  const typeConfig = config.aiVideo
  if (!typeConfig) {
    return [
      {
        field: 'aiVideo',
        message: 'AI Video configuration is missing',
      },
    ]
  }

  const errors: OutcomeValidationError[] = []

  const stepError = validateCaptureStepId(
    typeConfig.captureStepId,
    steps,
    'aiVideo',
  )
  if (stepError) errors.push(stepError)

  if (!typeConfig.videoGeneration?.prompt?.trim()) {
    errors.push({
      field: 'aiVideo.videoGeneration.prompt',
      message: 'Video generation prompt is required',
    })
  }

  if (typeConfig.startFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      typeConfig.startFrameImageGen.refMedia ?? [],
      'aiVideo.startFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  if (typeConfig.endFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      typeConfig.endFrameImageGen.refMedia ?? [],
      'aiVideo.endFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  return errors
}

// ── Main validator ──────────────────────────────────────────

const typeValidators: Record<
  string,
  (
    config: ExperienceConfig,
    steps: ExperienceStep[],
  ) => OutcomeValidationError[]
> = {
  photo: validatePhoto,
  'ai.image': validateAiImage,
  'ai.video': validateAiVideo,
}

/**
 * Validate outcome configuration for publishing.
 *
 * Takes the experience type and config (draft or published).
 * Survey type always passes (no per-type config to validate).
 */
export function validateOutcome(
  type: ExperienceType,
  config: ExperienceConfig | null,
  steps: ExperienceStep[],
): OutcomeValidationResult {
  // Survey has no per-type config
  if (type === 'survey') return { valid: true, errors: [] }

  if (!config) return { valid: true, errors: [] }

  if (COMING_SOON_TYPES.has(type)) {
    return {
      valid: false,
      errors: [
        {
          field: 'type',
          message: `${type.toUpperCase()} output is coming soon`,
        },
      ],
    }
  }

  const validator = typeValidators[type]
  const errors = validator ? validator(config, steps) : []

  return { valid: errors.length === 0, errors }
}
