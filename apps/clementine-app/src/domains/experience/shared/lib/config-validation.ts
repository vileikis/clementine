/**
 * Config Validation
 *
 * Validates per-type experience configuration for publishing.
 * Pure function for easy testing and reuse across publish hook and future UI.
 *
 * With the discriminated union schema, structural checks (e.g. "config is missing")
 * are enforced at parse time by Zod. Only semantic checks remain here.
 *
 * @see specs/083-config-discriminated-union
 */
import type { ExperienceConfig, ExperienceStep } from '@clementine/shared'

/**
 * Validation error returned from config validation.
 */
export interface ConfigValidationError {
  /** Field path that failed validation (e.g., 'photo.captureStepId') */
  field: string
  /** User-friendly error message */
  message: string
  /** Optional step ID for step-related errors */
  stepId?: string
}

/**
 * Result of config validation.
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean
  /** List of validation errors (empty if valid) */
  errors: ConfigValidationError[]
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
): ConfigValidationError | undefined {
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
): ConfigValidationError | undefined {
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
): ConfigValidationError[] {
  if (config.type !== 'photo') return []

  const error = validateCaptureStepId(
    config.photo.captureStepId,
    steps,
    'photo',
  )
  return error ? [error] : []
}

function validateAiImage(
  config: ExperienceConfig,
  steps: ExperienceStep[],
): ConfigValidationError[] {
  if (config.type !== 'ai.image') return []

  const errors: ConfigValidationError[] = []

  if (!config.aiImage.imageGeneration.prompt?.trim()) {
    errors.push({
      field: 'aiImage.imageGeneration.prompt',
      message: 'Prompt is required for AI Image output',
    })
  }

  if (config.aiImage.task === 'image-to-image') {
    const stepError = validateCaptureStepId(
      config.aiImage.captureStepId ?? '',
      steps,
      'aiImage',
    )
    if (stepError) errors.push(stepError)
  }

  const refError = validateRefMediaDisplayNames(
    config.aiImage.imageGeneration.refMedia ?? [],
    'aiImage.imageGeneration.refMedia',
  )
  if (refError) errors.push(refError)

  return errors
}

function validateAiVideo(
  config: ExperienceConfig,
  steps: ExperienceStep[],
): ConfigValidationError[] {
  if (config.type !== 'ai.video') return []

  const errors: ConfigValidationError[] = []

  const stepError = validateCaptureStepId(
    config.aiVideo.captureStepId,
    steps,
    'aiVideo',
  )
  if (stepError) errors.push(stepError)

  if (!config.aiVideo.videoGeneration?.prompt?.trim()) {
    errors.push({
      field: 'aiVideo.videoGeneration.prompt',
      message: 'Video generation prompt is required',
    })
  }

  if (config.aiVideo.startFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      config.aiVideo.startFrameImageGen.refMedia ?? [],
      'aiVideo.startFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  if (config.aiVideo.endFrameImageGen) {
    const refError = validateRefMediaDisplayNames(
      config.aiVideo.endFrameImageGen.refMedia ?? [],
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
  ) => ConfigValidationError[]
> = {
  photo: validatePhoto,
  'ai.image': validateAiImage,
  'ai.video': validateAiVideo,
}

/**
 * Validate experience config for publishing.
 *
 * Reads type from `config.type` (discriminated union).
 * Survey type always passes (no per-type config to validate).
 * Structural checks are enforced by the Zod discriminated union at parse time.
 */
export function validateConfig(
  config: ExperienceConfig,
  steps: ExperienceStep[],
): ConfigValidationResult {
  const { type } = config

  // Survey has no per-type config
  if (type === 'survey') return { valid: true, errors: [] }

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
  if (!validator) {
    return {
      valid: false,
      errors: [
        { field: 'type', message: `No validator registered for type: ${type}` },
      ],
    }
  }
  const errors = validator(config, steps)

  return { valid: errors.length === 0, errors }
}
