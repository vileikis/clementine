/**
 * useExperienceConfigValidation Hook
 *
 * Validates per-type experience configuration and returns validation errors.
 * Used for inline error display in the create tab form.
 *
 * Validation Rules (per-type):
 * - photo: captureStepId must reference a valid capture step
 * - ai.image: prompt required, captureStepId valid for i2i, no duplicate refMedia displayNames
 * - ai.video: captureStepId required, prompt required, no duplicate refMedia displayNames
 * - gif/video: not yet supported
 *
 * @see specs/081-experience-type-flattening
 */
import { useMemo } from 'react'
import type {
  AIImageConfig,
  AIVideoConfig,
  ExperienceConfig,
  ExperienceStep,
  ExperienceType,
  PhotoConfig,
} from '@clementine/shared'

/**
 * Field-level validation error for inline display
 */
export interface FieldValidationError {
  /** Field path that has the error (e.g., 'photo.captureStepId', 'aiImage.imageGeneration.prompt') */
  field: string
  /** Human-readable error message */
  message: string
}

// ── Shared helpers ──────────────────────────────────────────

function isCaptureStep(step: ExperienceStep, id: string): boolean {
  return step.id === id && step.type === 'capture.photo'
}

function validateCaptureStepId(
  captureStepId: string | null | undefined,
  steps: ExperienceStep[],
  fieldPrefix: string,
): FieldValidationError | undefined {
  if (!captureStepId) {
    return {
      field: `${fieldPrefix}.captureStepId`,
      message: 'Select a source image step',
    }
  }

  if (!steps.some((s) => isCaptureStep(s, captureStepId))) {
    return {
      field: `${fieldPrefix}.captureStepId`,
      message: 'Selected source step no longer exists',
    }
  }

  return undefined
}

function validateUniqueRefMediaNames(
  refMedia: { displayName: string }[],
  field: string,
): FieldValidationError | undefined {
  const names = refMedia.map((m) => m.displayName)
  if (names.length !== new Set(names).size) {
    return { field, message: 'Reference images must have unique names' }
  }
  return undefined
}

// ── Per-type validators ─────────────────────────────────────

function validatePhoto(
  config: PhotoConfig,
  steps: ExperienceStep[],
): FieldValidationError[] {
  const errors: FieldValidationError[] = []

  const stepError = validateCaptureStepId(config.captureStepId, steps, 'photo')
  if (stepError) errors.push(stepError)

  return errors
}

function validateAiImage(
  config: AIImageConfig,
  steps: ExperienceStep[],
): FieldValidationError[] {
  const errors: FieldValidationError[] = []

  if (!config.imageGeneration?.prompt?.trim()) {
    errors.push({
      field: 'aiImage.imageGeneration.prompt',
      message: 'Prompt is required',
    })
  }

  if (config.task === 'image-to-image') {
    const stepError = validateCaptureStepId(
      config.captureStepId,
      steps,
      'aiImage',
    )
    if (stepError) {
      stepError.message =
        stepError.message === 'Select a source image step'
          ? 'Select a source image step for image-to-image'
          : stepError.message
      errors.push(stepError)
    }
  }

  const refError = validateUniqueRefMediaNames(
    config.imageGeneration?.refMedia ?? [],
    'aiImage.imageGeneration.refMedia',
  )
  if (refError) errors.push(refError)

  return errors
}

function validateAiVideo(
  config: AIVideoConfig,
  steps: ExperienceStep[],
): FieldValidationError[] {
  const errors: FieldValidationError[] = []

  const stepError = validateCaptureStepId(
    config.captureStepId,
    steps,
    'aiVideo',
  )
  if (stepError) errors.push(stepError)

  if (!config.videoGeneration?.prompt?.trim()) {
    errors.push({
      field: 'aiVideo.videoGeneration.prompt',
      message: 'Prompt is required',
    })
  }

  if (config.startFrameImageGen) {
    const refError = validateUniqueRefMediaNames(
      config.startFrameImageGen.refMedia ?? [],
      'aiVideo.startFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  if (config.endFrameImageGen) {
    const refError = validateUniqueRefMediaNames(
      config.endFrameImageGen.refMedia ?? [],
      'aiVideo.endFrameImageGen.refMedia',
    )
    if (refError) errors.push(refError)
  }

  return errors
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Validates experience configuration based on experience type
 */
export function useExperienceConfigValidation(
  type: ExperienceType,
  config: ExperienceConfig | null,
  steps: ExperienceStep[],
): FieldValidationError[] {
  return useMemo(() => {
    if (!config)
      return [
        { field: 'config', message: 'Experience configuration is required' },
      ]

    // Narrow via config.type (discriminated union) for type-safe field access
    if (config.type === 'survey') return []

    if (config.type === 'gif' || config.type === 'video') {
      return [
        { field: 'type', message: `${config.type.toUpperCase()} coming soon` },
      ]
    }

    // Null checks for form state (form values may temporarily be null via clear action)
    if (config.type === 'photo')
      return config.photo
        ? validatePhoto(config.photo, steps)
        : [{ field: 'photo', message: 'Photo configuration is missing' }]
    if (config.type === 'ai.image')
      return config.aiImage
        ? validateAiImage(config.aiImage, steps)
        : [{ field: 'aiImage', message: 'AI Image configuration is missing' }]
    if (config.type === 'ai.video')
      return config.aiVideo
        ? validateAiVideo(config.aiVideo, steps)
        : [{ field: 'aiVideo', message: 'AI Video configuration is missing' }]

    return [
      {
        field: 'type',
        message: `No validator registered for type: ${type}`,
      },
    ]
  }, [type, config, steps])
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
