/**
 * Upload Progress State
 *
 * Shows photo with upload spinner overlay while saving.
 * Uses CaptureLayout + PhotoFrame for visual continuity with camera state.
 */

import { Loader2 } from 'lucide-react'
import { CaptureLayout } from './CaptureLayout'
import type { AspectRatio, CapturedPhoto } from '@/shared/camera'
import { PhotoFrame } from '@/shared/camera'
import { ThemedText } from '@/shared/theming'

interface UploadProgressProps {
  photo: CapturedPhoto | null
  aspectRatio: AspectRatio
}

export function UploadProgress({ photo, aspectRatio }: UploadProgressProps) {
  return (
    <CaptureLayout
      controls={
        <ThemedText variant="body" className="opacity-80">
          Saving your photo...
        </ThemedText>
      }
    >
      {photo?.previewUrl ? (
        <PhotoFrame
          src={photo.previewUrl}
          aspectRatio={aspectRatio}
          alt="Uploading photo"
          className="w-full h-full"
          overlay={<Loader2 className="h-12 w-12 animate-spin text-white" />}
        />
      ) : (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center pb-12">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </CaptureLayout>
  )
}
