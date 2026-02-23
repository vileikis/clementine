/**
 * Outcome Operations
 *
 * Pure functions for updating per-type outcome configuration.
 * These functions return new objects rather than mutating in place.
 *
 * @see specs/072-outcome-schema-redesign
 */
import { MAX_REF_MEDIA_COUNT } from './model-options'
import type {
  AIImageOutcomeConfig,
  AIVideoOutcomeConfig,
  ExperienceStep,
  MediaReference,
  Outcome,
  OutcomeType,
  PhotoOutcomeConfig,
} from '@clementine/shared'

/**
 * Create a default outcome configuration (no type selected).
 */
export function createDefaultOutcome(): Outcome {
  return {
    type: null,
    photo: null,
    gif: null,
    video: null,
    aiImage: null,
    aiVideo: null,
  }
}

/**
 * Create a default PhotoOutcomeConfig.
 */
export function createDefaultPhotoConfig(
  captureStepId?: string,
): PhotoOutcomeConfig {
  return {
    captureStepId: captureStepId ?? '',
    aspectRatio: '1:1',
  }
}

/**
 * Create a default AIImageOutcomeConfig.
 */
export function createDefaultAIImageConfig(
  captureStepId?: string | null,
): AIImageOutcomeConfig {
  return {
    task: 'text-to-image',
    captureStepId: captureStepId ?? null,
    aspectRatio: '1:1',
    imageGeneration: {
      prompt: '',
      model: 'gemini-2.5-flash-image',
      refMedia: [],
      aspectRatio: null,
    },
  }
}

/**
 * Create a default AIVideoOutcomeConfig.
 */
export function createDefaultAIVideoConfig(
  captureStepId?: string,
): AIVideoOutcomeConfig {
  return {
    task: 'image-to-video',
    captureStepId: captureStepId ?? '',
    aspectRatio: '9:16',
    startFrameImageGen: null,
    endFrameImageGen: null,
    videoGeneration: {
      prompt: '',
      model: 'veo-3.1-fast-generate-001',
      duration: 6,
      aspectRatio: null,
      refMedia: [],
    },
  }
}

/**
 * Initialize outcome with a type and default config.
 *
 * Smart defaults: if exactly 1 capture.photo step exists, auto-set captureStepId.
 * If the type already has a config, reuse it (preserves switching).
 */
export function initializeOutcomeType(
  outcome: Outcome,
  type: OutcomeType,
  steps: ExperienceStep[],
): Outcome {
  const captureSteps = steps.filter((s) => s.type === 'capture.photo')
  const autoStepId = captureSteps.length === 1 ? captureSteps[0].id : undefined

  const updated = { ...outcome, type }

  // Only initialize config if it doesn't already exist (preserves switching)
  if (type === 'photo' && !outcome.photo) {
    updated.photo = createDefaultPhotoConfig(autoStepId)
  } else if (type === 'ai.image' && !outcome.aiImage) {
    updated.aiImage = createDefaultAIImageConfig()
  } else if (type === 'ai.video' && !outcome.aiVideo) {
    updated.aiVideo = createDefaultAIVideoConfig(autoStepId)
  }

  return updated
}

/**
 * Update photo config fields.
 */
export function updatePhotoConfig(
  outcome: Outcome,
  updates: Partial<PhotoOutcomeConfig>,
): Outcome {
  return {
    ...outcome,
    photo: {
      ...(outcome.photo ?? createDefaultPhotoConfig()),
      ...updates,
    },
  }
}

/**
 * Update AI image config fields.
 */
export function updateAIImageConfig(
  outcome: Outcome,
  updates: Partial<AIImageOutcomeConfig>,
): Outcome {
  return {
    ...outcome,
    aiImage: {
      ...(outcome.aiImage ?? createDefaultAIImageConfig()),
      ...updates,
    },
  }
}

/**
 * Add reference media to the AI image outcome config.
 * Enforces the maximum count limit.
 */
export function addOutcomeRefMedia(
  outcome: Outcome,
  newMedia: MediaReference[],
): Outcome {
  const currentMedia = outcome.aiImage?.imageGeneration.refMedia ?? []
  const availableSlots = MAX_REF_MEDIA_COUNT - currentMedia.length
  const mediaToAdd = newMedia.slice(0, availableSlots)

  return {
    ...outcome,
    aiImage: {
      ...(outcome.aiImage ?? createDefaultAIImageConfig()),
      imageGeneration: {
        ...(outcome.aiImage?.imageGeneration ??
          createDefaultAIImageConfig().imageGeneration),
        refMedia: [...currentMedia, ...mediaToAdd],
      },
    },
  }
}

/**
 * Remove reference media from the AI image outcome config.
 */
export function removeOutcomeRefMedia(
  outcome: Outcome,
  mediaAssetId: string,
): Outcome {
  if (!outcome.aiImage) return outcome

  return {
    ...outcome,
    aiImage: {
      ...outcome.aiImage,
      imageGeneration: {
        ...outcome.aiImage.imageGeneration,
        refMedia: outcome.aiImage.imageGeneration.refMedia.filter(
          (m) => m.mediaAssetId !== mediaAssetId,
        ),
      },
    },
  }
}

/**
 * Check if more reference media can be added.
 */
export function canAddMoreRefMedia(outcome: Outcome): boolean {
  const count = outcome.aiImage?.imageGeneration.refMedia.length ?? 0
  return count < MAX_REF_MEDIA_COUNT
}

/**
 * Get available slots for reference media.
 */
export function getAvailableRefMediaSlots(outcome: Outcome): number {
  const count = outcome.aiImage?.imageGeneration.refMedia.length ?? 0
  return MAX_REF_MEDIA_COUNT - count
}

/**
 * Characters that are invalid in displayName because they conflict
 * with the @{ref:displayName} mention serialization format.
 */
const INVALID_DISPLAY_NAME_CHARS = /[{}:]/g

/**
 * Sanitize a display name by removing invalid characters.
 * Invalid characters are: }, {, : (which conflict with mention syntax)
 */
export function sanitizeDisplayName(displayName: string): string {
  return displayName.replace(INVALID_DISPLAY_NAME_CHARS, '')
}

/**
 * Check if a display name contains invalid characters.
 */
export function hasInvalidDisplayNameChars(displayName: string): boolean {
  return INVALID_DISPLAY_NAME_CHARS.test(displayName)
}
