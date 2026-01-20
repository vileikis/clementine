/**
 * Upload Progress State
 *
 * Shows photo with upload spinner overlay while saving.
 */

import { Loader2 } from 'lucide-react'
import type { CapturedPhoto } from '@/shared/camera'
import { ThemedText } from '@/shared/theming'

interface UploadProgressProps {
  photo: CapturedPhoto | null
  isSquare: boolean
}

export function UploadProgress({ photo, isSquare }: UploadProgressProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Preview image */}
      {photo?.previewUrl && (
        <div
          className={`relative overflow-hidden rounded-lg ${
            isSquare ? 'w-64 h-64' : 'w-44 h-80'
          }`}
        >
          <img
            src={photo.previewUrl}
            alt="Uploading photo"
            className="w-full h-full object-cover"
          />
          {/* Overlay with spinner */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2
              className="h-12 w-12 animate-spin"
              style={{ color: 'white' }}
            />
          </div>
        </div>
      )}

      <ThemedText variant="body" className="opacity-80">
        Saving your photo...
      </ThemedText>
    </div>
  )
}
