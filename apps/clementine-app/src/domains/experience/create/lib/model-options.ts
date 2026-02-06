/**
 * Model Options
 *
 * Constants for AI model and aspect ratio selection.
 * Extracted to allow reuse across different outcome types.
 */

/**
 * Available AI image generation models.
 */
export const AI_IMAGE_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
] as const

/**
 * Available aspect ratios for image generation.
 */
export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
] as const

/** Maximum number of reference media allowed */
export const MAX_REF_MEDIA_COUNT = 5

export type AIImageModel = (typeof AI_IMAGE_MODELS)[number]['value']
export type AspectRatio = (typeof ASPECT_RATIOS)[number]['value']
