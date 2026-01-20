/**
 * AspectRatio Contract
 *
 * Defines the extended aspect ratio type and related utilities
 * for the capture-photo-extend feature.
 *
 * @feature 035-capture-photo-extend
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Extended aspect ratio options for photo capture.
 *
 * @description
 * - '1:1': Square format (1.0 ratio)
 * - '9:16': Tall portrait for stories/reels (0.5625 ratio)
 * - '3:2': Landscape format (1.5 ratio) - NEW
 * - '2:3': Tall portrait format (0.667 ratio) - NEW
 * - '3:4': Portrait format (0.75 ratio) - internal camera module only
 */
export type AspectRatio = '3:4' | '1:1' | '9:16' | '3:2' | '2:3'

/**
 * Aspect ratios exposed to experience creators in the config panel.
 * Subset of AspectRatio that excludes internal-only values.
 */
export type ConfigurableAspectRatio = '1:1' | '9:16' | '3:2' | '2:3'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Numeric aspect ratio values (width / height).
 * Used for canvas cropping calculations.
 */
export const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4, // 0.75 - portrait
  '1:1': 1, // 1.0  - square
  '9:16': 9 / 16, // 0.5625 - tall portrait (stories/reels)
  '3:2': 3 / 2, // 1.5 - landscape (NEW)
  '2:3': 2 / 3, // 0.667 - tall portrait (NEW)
}

/**
 * CSS aspect-ratio property values.
 * Used for responsive container sizing.
 */
export const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

// =============================================================================
// CONFIG PANEL OPTIONS
// =============================================================================

/**
 * Option shape for editor select fields.
 */
export interface EditorOption<T> {
  value: T
  label: string
}

/**
 * Aspect ratio options for the CapturePhotoConfigPanel dropdown.
 * Ordered by common usage: square first, then portrait variants, then landscape.
 */
export const ASPECT_RATIO_OPTIONS: EditorOption<ConfigurableAspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '2:3', label: 'Tall Portrait (2:3)' },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determines if an aspect ratio is landscape (wider than tall).
 */
export function isLandscape(aspectRatio: AspectRatio): boolean {
  return ASPECT_RATIO_VALUES[aspectRatio] > 1
}

/**
 * Determines if an aspect ratio is portrait (taller than wide).
 */
export function isPortrait(aspectRatio: AspectRatio): boolean {
  return ASPECT_RATIO_VALUES[aspectRatio] < 1
}

/**
 * Determines if an aspect ratio is square.
 */
export function isSquare(aspectRatio: AspectRatio): boolean {
  return ASPECT_RATIO_VALUES[aspectRatio] === 1
}
