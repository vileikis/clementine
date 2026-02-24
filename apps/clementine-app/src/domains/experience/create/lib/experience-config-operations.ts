/**
 * Experience Config Operations
 *
 * Pure functions for updating per-type experience configuration.
 * These functions return new objects rather than mutating in place.
 *
 * @see specs/081-experience-type-flattening
 */
import { MAX_REF_MEDIA_COUNT } from './model-options'
import type {
  AIImageConfig,
  AIVideoConfig,
  ExperienceStep,
  ExperienceType,
  OutcomeType,
  PhotoConfig,
} from '@clementine/shared'

/**
 * Config field key for each outcome type.
 * Maps OutcomeType → key on ExperienceConfig / SnapshotConfig.
 */
export const CONFIG_KEYS = {
  photo: 'photo',
  gif: 'gif',
  video: 'video',
  'ai.image': 'aiImage',
  'ai.video': 'aiVideo',
} as const satisfies Record<OutcomeType, string>

/** Config field key type */
export type ConfigKey = (typeof CONFIG_KEYS)[OutcomeType]

/**
 * Get the config field key for a given experience type.
 * Returns null for survey (no per-type config).
 */
export function getConfigKey(type: ExperienceType): ConfigKey | null {
  if (type === 'survey') return null
  return CONFIG_KEYS[type]
}

/**
 * Create a default PhotoConfig.
 */
export function createDefaultPhotoConfig(captureStepId?: string): PhotoConfig {
  return {
    captureStepId: captureStepId ?? '',
    aspectRatio: '1:1',
  }
}

/**
 * Create a default AIImageConfig.
 */
export function createDefaultAIImageConfig(
  captureStepId?: string | null,
): AIImageConfig {
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
 * Create a default AIVideoConfig.
 */
export function createDefaultAIVideoConfig(
  captureStepId?: string,
): AIVideoConfig {
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
 * Get the default config for a given outcome type.
 *
 * Smart defaults: if exactly 1 capture.photo step exists, auto-set captureStepId.
 */
export function getDefaultConfigForType(
  type: OutcomeType,
  steps: ExperienceStep[],
): PhotoConfig | AIImageConfig | AIVideoConfig | null {
  const captureSteps = steps.filter((s) => s.type === 'capture.photo')
  const autoStepId = captureSteps.length === 1 ? captureSteps[0].id : undefined

  switch (type) {
    case 'photo':
      return createDefaultPhotoConfig(autoStepId)
    case 'ai.image':
      return createDefaultAIImageConfig()
    case 'ai.video':
      return createDefaultAIVideoConfig(autoStepId)
    default:
      return null
  }
}

/**
 * Check if more reference media can be added.
 */
export function canAddMoreRefMedia(config: AIImageConfig | null): boolean {
  const count = config?.imageGeneration.refMedia.length ?? 0
  return count < MAX_REF_MEDIA_COUNT
}

/**
 * Get available slots for reference media.
 */
export function getAvailableRefMediaSlots(
  config: AIImageConfig | null,
): number {
  const count = config?.imageGeneration.refMedia.length ?? 0
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
