/**
 * Photo Preview State
 *
 * Shows captured photo with retake and confirm options.
 * Uses CaptureLayout + PhotoFrame for visual continuity with camera state.
 */

import { CaptureLayout } from './CaptureLayout'
import type { AspectRatio, CapturedPhoto } from '@/shared/camera'
import { PhotoFrame } from '@/shared/camera'
import { ThemedButton } from '@/shared/theming'

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
    <CaptureLayout
      controls={
        <div className="flex items-center justify-center gap-4">
          <ThemedButton onClick={onRetake} variant="outline">
            Retake
          </ThemedButton>
          <ThemedButton onClick={onConfirm} variant="primary">
            Continue
          </ThemedButton>
        </div>
      }
    >
      <PhotoFrame
        src={photo.previewUrl}
        aspectRatio={aspectRatio}
        alt="Captured photo preview"
        className="w-full h-full"
      />
    </CaptureLayout>
  )
}
