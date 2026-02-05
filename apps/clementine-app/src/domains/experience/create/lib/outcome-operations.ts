/**
 * Outcome Operations
 *
 * Pure functions for updating outcome configuration.
 * These functions return new objects rather than mutating in place.
 */
import { MAX_REF_MEDIA_COUNT } from './model-options'
import type {
  AIImageAspectRatio,
  AIImageModel,
  MediaReference,
  Outcome,
  OutcomeType,
} from '@clementine/shared'

/**
 * Create a default outcome configuration.
 */
export function createDefaultOutcome(): Outcome {
  return {
    type: null,
    captureStepId: null,
    aiEnabled: true,
    imageGeneration: {
      prompt: '',
      refMedia: [],
      model: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
    },
    options: null,
  }
}

/**
 * Update the outcome type.
 */
export function updateOutcomeType(
  outcome: Outcome,
  type: OutcomeType | null,
): Outcome {
  return {
    ...outcome,
    type,
  }
}

/**
 * Update the capture step ID (source image).
 */
export function updateOutcomeCaptureStepId(
  outcome: Outcome,
  captureStepId: string | null,
): Outcome {
  return {
    ...outcome,
    captureStepId,
  }
}

/**
 * Update the AI enabled flag.
 */
export function updateOutcomeAiEnabled(
  outcome: Outcome,
  aiEnabled: boolean,
): Outcome {
  return {
    ...outcome,
    aiEnabled,
  }
}

/**
 * Update the prompt.
 */
export function updateOutcomePrompt(outcome: Outcome, prompt: string): Outcome {
  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      prompt,
    },
  }
}

/**
 * Update the AI model.
 */
export function updateOutcomeModel(
  outcome: Outcome,
  model: AIImageModel,
): Outcome {
  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      model,
    },
  }
}

/**
 * Update the aspect ratio.
 */
export function updateOutcomeAspectRatio(
  outcome: Outcome,
  aspectRatio: AIImageAspectRatio,
): Outcome {
  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      aspectRatio,
    },
  }
}

/**
 * Add reference media to the outcome.
 * Enforces the maximum count limit.
 */
export function addOutcomeRefMedia(
  outcome: Outcome,
  newMedia: MediaReference[],
): Outcome {
  const currentMedia = outcome.imageGeneration.refMedia
  const availableSlots = MAX_REF_MEDIA_COUNT - currentMedia.length
  const mediaToAdd = newMedia.slice(0, availableSlots)

  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      refMedia: [...currentMedia, ...mediaToAdd],
    },
  }
}

/**
 * Remove reference media from the outcome.
 */
export function removeOutcomeRefMedia(
  outcome: Outcome,
  mediaAssetId: string,
): Outcome {
  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      refMedia: outcome.imageGeneration.refMedia.filter(
        (m) => m.mediaAssetId !== mediaAssetId,
      ),
    },
  }
}

/**
 * Update reference media display name.
 */
export function updateOutcomeRefMediaDisplayName(
  outcome: Outcome,
  mediaAssetId: string,
  displayName: string,
): Outcome {
  return {
    ...outcome,
    imageGeneration: {
      ...outcome.imageGeneration,
      refMedia: outcome.imageGeneration.refMedia.map((m) =>
        m.mediaAssetId === mediaAssetId ? { ...m, displayName } : m,
      ),
    },
  }
}

/**
 * Check if more reference media can be added.
 */
export function canAddMoreRefMedia(outcome: Outcome): boolean {
  return outcome.imageGeneration.refMedia.length < MAX_REF_MEDIA_COUNT
}

/**
 * Get available slots for reference media.
 */
export function getAvailableRefMediaSlots(outcome: Outcome): number {
  return MAX_REF_MEDIA_COUNT - outcome.imageGeneration.refMedia.length
}

// MAX_REF_MEDIA_COUNT is exported from model-options.ts

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
