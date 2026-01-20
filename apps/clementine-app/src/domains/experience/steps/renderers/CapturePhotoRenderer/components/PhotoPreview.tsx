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
import type { AspectRatio } from '../../../schemas/capture-photo.schema'
import { ThemedButton } from '@/shared/theming'

/**
 * CSS aspect-ratio values for the preview container
 */
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

interface PhotoPreviewProps {
  photo: CapturedPhoto
  aspectRatio: AspectRatio
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
    <div className="flex flex-col h-full w-full max-w-md mx-auto">
      {/* Preview container - matches camera container styling */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div
          className="w-full max-h-[70vh] bg-black rounded-2xl overflow-hidden"
          style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
        >
          <img
            src={photo.previewUrl}
            alt="Captured photo preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls row - Retake and Continue */}
      <div className="flex items-center justify-center gap-4 py-6">
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
