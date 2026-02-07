/**
 * Upload Progress State
 *
 * Shows photo with upload spinner overlay while saving.
 * Uses CSS aspect-ratio for responsive sizing.
 */

import { Loader2 } from 'lucide-react'
import type { CapturedPhoto } from '@/shared/camera'
import type { ExperienceAspectRatio } from '@clementine/shared'
import { ThemedText } from '@/shared/theming'

/**
 * CSS aspect-ratio values for the preview container
 */
const ASPECT_RATIO_CSS: Record<ExperienceAspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

interface UploadProgressProps {
  photo: CapturedPhoto | null
  aspectRatio: ExperienceAspectRatio
}

export function UploadProgress({ photo, aspectRatio }: UploadProgressProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Preview image - responsive sizing */}
      {photo?.previewUrl && (
        <div
          className="relative w-full max-h-full overflow-hidden rounded-lg"
          style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
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
