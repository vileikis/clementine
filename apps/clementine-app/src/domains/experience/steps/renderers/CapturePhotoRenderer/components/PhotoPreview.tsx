/**
 * Photo Preview State
 *
 * Shows captured photo with retake and confirm options.
 * Uses CSS aspect-ratio for responsive sizing that fills available space.
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
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Preview image - responsive sizing */}
      <div
        className="w-full max-h-full overflow-hidden rounded-lg"
        style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
      >
        <img
          src={photo.previewUrl}
          alt="Captured photo preview"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-xs">
        <ThemedButton
          onClick={onRetake}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          Retake
        </ThemedButton>
        <ThemedButton onClick={onConfirm} size="lg" className="flex-1">
          Continue
        </ThemedButton>
      </div>
    </div>
  )
}
