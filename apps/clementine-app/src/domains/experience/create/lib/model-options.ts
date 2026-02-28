/**
 * Model Options
 *
 * Constants for AI model, aspect ratio, and outcome type selection.
 * Extracted to allow reuse across different outcome types.
 *
 * Aspect ratios use the canonical definitions from @clementine/shared.
 *
 * @see specs/072-outcome-schema-redesign
 */
import { IMAGE_ASPECT_RATIOS as CANONICAL_ASPECT_RATIOS } from '@clementine/shared'
import type {
  AspectRatio as CanonicalAspectRatio,
  OutcomeType,
} from '@clementine/shared'

/**
 * Available AI image generation models.
 */
export const AI_IMAGE_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
] as const

/**
 * Available AI video generation models.
 */
export const AI_VIDEO_MODELS = [
  { value: 'veo-3.1-generate-001', label: 'Veo 3.1' },
  { value: 'veo-3.1-fast-generate-001', label: 'Veo 3.1 Fast' },
] as const

/**
 * Available aspect ratios for image generation.
 * Uses canonical definitions from @clementine/shared (excludes 16:9).
 */
export const ASPECT_RATIOS = CANONICAL_ASPECT_RATIOS.map((value) => ({
  value,
  label: value,
}))

/** Maximum number of reference media allowed */
export const MAX_REF_MEDIA_COUNT = 5

/** Maximum number of reference media allowed for video Remix task */
export const MAX_VIDEO_REF_MEDIA_COUNT = 2

/**
 * Available video duration options (fixed values).
 * String values for Select component compatibility.
 */
export const DURATION_OPTIONS = [
  { value: '4', label: '4s' },
  { value: '6', label: '6s' },
  { value: '8', label: '8s' },
] as const

export type AIImageModel = (typeof AI_IMAGE_MODELS)[number]['value']
export type AspectRatio = CanonicalAspectRatio

/**
 * All 5 outcome types in the system.
 */
export const OUTCOME_TYPES: OutcomeType[] = [
  'photo',
  'gif',
  'video',
  'ai.image',
  'ai.video',
]

/**
 * Currently enabled outcome types (selectable by users).
 */
export const ENABLED_OUTCOME_TYPES: OutcomeType[] = [
  'photo',
  'ai.image',
  'ai.video',
]

/**
 * Outcome types that are not yet implemented (shown as "Coming soon").
 */
export const COMING_SOON_TYPES: OutcomeType[] = ['gif', 'video']

/**
 * User-facing labels for outcome types.
 */
export const OUTCOME_TYPE_LABELS: Record<OutcomeType, string> = {
  photo: 'Photo',
  gif: 'GIF',
  video: 'Video',
  'ai.image': 'AI Image',
  'ai.video': 'AI Video',
}
