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
    <div className="flex flex-col h-full w-full">
      {/* Preview Zone - fills remaining space, centers content */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {photo?.previewUrl && (
          <div className="relative max-w-full max-h-full">
            <img
              src={photo.previewUrl}
              alt="Uploading photo"
              className="max-w-full max-h-full object-contain"
              style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
            />
            {/* Overlay with spinner */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <Loader2
                className="h-12 w-12 animate-spin"
                style={{ color: 'white' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Zone - consistent with controls zone positioning */}
      <div className="flex items-center justify-center py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
        <ThemedText variant="body" className="opacity-80">
          Saving your photo...
        </ThemedText>
      </div>
    </div>
  )
}
