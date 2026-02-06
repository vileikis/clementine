/**
 * Model Options
 *
 * Constants for AI model and aspect ratio selection.
 * Extracted to allow reuse across different outcome types.
 *
 * Aspect ratios use the canonical definitions from @clementine/shared.
 */
import { ASPECT_RATIOS as CANONICAL_ASPECT_RATIOS } from '@clementine/shared'
import type { AspectRatio as CanonicalAspectRatio } from '@clementine/shared'

/**
 * Available AI image generation models.
 */
export const AI_IMAGE_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
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

export type AIImageModel = (typeof AI_IMAGE_MODELS)[number]['value']
export type AspectRatio = CanonicalAspectRatio
