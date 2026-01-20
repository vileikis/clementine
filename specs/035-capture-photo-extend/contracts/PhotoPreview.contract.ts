/**
 * PhotoPreview Contract
 *
 * Defines the updated PhotoPreview component interface
 * with responsive sizing support.
 *
 * @feature 035-capture-photo-extend
 */

import type { CapturedPhoto } from '@/shared/camera'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Aspect ratio for the photo preview container.
 * Uses the configurable subset (excludes internal '3:4').
 */
export type PreviewAspectRatio = '1:1' | '9:16' | '3:2' | '2:3'

/**
 * Props for the PhotoPreview component.
 *
 * @description
 * BEFORE (fixed sizing):
 * - isSquare: boolean - determined fixed pixel dimensions
 *
 * AFTER (responsive sizing):
 * - aspectRatio: PreviewAspectRatio - drives CSS aspect-ratio property
 */
export interface PhotoPreviewProps {
  /** Captured photo data with preview URL */
  photo: CapturedPhoto

  /** Aspect ratio for responsive container sizing */
  aspectRatio: PreviewAspectRatio

  /** Callback when user wants to retake photo */
  onRetake: () => void

  /** Callback when user confirms photo */
  onConfirm: () => void
}

// =============================================================================
// COMPONENT CONTRACT
// =============================================================================

/**
 * PhotoPreview Component Contract
 *
 * Renders a captured photo with retake/confirm actions.
 * Uses CSS aspect-ratio for responsive sizing that fills available space.
 *
 * @behavior
 * - Container uses `w-full` with `aspect-ratio` CSS property
 * - Image scales to fill container with `object-cover`
 * - Maintains aspect ratio on all screen sizes
 * - Action buttons remain full-width below the preview
 *
 * @example
 * ```tsx
 * <PhotoPreview
 *   photo={capturedPhoto}
 *   aspectRatio="3:2"
 *   onRetake={handleRetake}
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export interface PhotoPreviewContract {
  (props: PhotoPreviewProps): JSX.Element
}

// =============================================================================
// STYLING CONTRACT
// =============================================================================

/**
 * CSS aspect-ratio values for the preview container.
 */
export const PREVIEW_ASPECT_RATIO_CSS: Record<PreviewAspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

/**
 * Expected container styling (Tailwind classes + inline style).
 *
 * The preview container should:
 * 1. Use full width of parent: `w-full`
 * 2. Constrain max height: `max-h-full`
 * 3. Apply aspect-ratio via inline style
 * 4. Maintain rounded corners: `rounded-lg`
 * 5. Hide overflow: `overflow-hidden`
 */
export const PREVIEW_CONTAINER_CLASSES = 'w-full max-h-full overflow-hidden rounded-lg'

/**
 * Expected image styling.
 *
 * The image should:
 * 1. Fill container: `w-full h-full`
 * 2. Cover while maintaining aspect: `object-cover`
 */
export const PREVIEW_IMAGE_CLASSES = 'w-full h-full object-cover'
