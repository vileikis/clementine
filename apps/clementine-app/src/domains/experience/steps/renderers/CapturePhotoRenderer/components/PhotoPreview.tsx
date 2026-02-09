/**
 * Photo Preview State
 *
 * Shows captured photo with retake and confirm options.
 * Layout matches CameraActive: container (black bg, rounded) + control row.
 *
 * Responsive behavior:
 * - Mobile: preview fills available vertical space
 * - Desktop: preview container has max dimensions, centered vertically
 */

import type { CapturedPhoto } from '@/shared/camera'
import type { ExperienceAspectRatio } from '@clementine/shared'
import { ThemedButton } from '@/shared/theming'

/**
 * CSS aspect-ratio values for the preview container
 */
const ASPECT_RATIO_CSS: Record<ExperienceAspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

interface PhotoPreviewProps {
  photo: CapturedPhoto
  aspectRatio: ExperienceAspectRatio
  onRetake: () => void
  onConfirm: () => void
}

export function PhotoPreview({
  photo,
  aspectRatio,
  onRetake,
  onConfirm,
}: PhotoPreviewProps) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Preview Zone - NO black container for cleaner appearance */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <img
          src={photo.previewUrl}
          alt="Captured photo preview"
          className="max-w-full max-h-full object-contain"
          style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
        />
      </div>

      {/* Controls Zone - fixed height with safe-area padding */}
      <div className="flex items-center justify-center gap-4 py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
        <ThemedButton onClick={onRetake} variant="outline">
          Retake
        </ThemedButton>
        <ThemedButton onClick={onConfirm} variant="primary">
          Continue
        </ThemedButton>
      </div>
    </div>
  )
}
