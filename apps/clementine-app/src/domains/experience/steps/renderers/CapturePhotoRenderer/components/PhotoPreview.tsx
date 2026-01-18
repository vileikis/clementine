/**
 * Photo Preview State
 *
 * Shows captured photo with retake and confirm options.
 */

import { ThemedButton } from '@/shared/theming'
import type { CapturedPhoto } from '@/shared/camera'

interface PhotoPreviewProps {
  photo: CapturedPhoto
  isSquare: boolean
  onRetake: () => void
  onConfirm: () => void
}

export function PhotoPreview({
  photo,
  isSquare,
  onRetake,
  onConfirm,
}: PhotoPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Preview image */}
      <div
        className={`overflow-hidden rounded-lg ${
          isSquare ? 'w-64 h-64' : 'w-44 h-80'
        }`}
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
