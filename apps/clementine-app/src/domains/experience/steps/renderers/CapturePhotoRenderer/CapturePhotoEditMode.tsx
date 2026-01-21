/**
 * Capture Photo Edit Mode
 *
 * Preview-only display for the experience designer.
 * Shows camera placeholder with aspect ratio indicator.
 */

import { Camera } from 'lucide-react'
import { StepLayout } from '../StepLayout'
import type { ExperienceAspectRatio } from '@clementine/shared'
import { ThemedText, useEventTheme } from '@/shared/theming'

/**
 * CSS aspect-ratio values for the preview container
 */
const ASPECT_RATIO_CSS: Record<ExperienceAspectRatio, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

interface CapturePhotoEditModeProps {
  aspectRatio: ExperienceAspectRatio
}

export function CapturePhotoEditMode({
  aspectRatio,
}: CapturePhotoEditModeProps) {
  const { theme } = useEventTheme()

  return (
    <StepLayout hideButton>
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Camera placeholder with aspect ratio */}
        <div
          className="flex flex-col items-center justify-center rounded-lg w-full"
          style={{
            aspectRatio: ASPECT_RATIO_CSS[aspectRatio],
            backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
          }}
        >
          <Camera
            className="h-16 w-16"
            style={{ color: theme.text.color, opacity: 0.5 }}
          />
          <ThemedText variant="body" className="mt-3 opacity-60">
            Camera
          </ThemedText>
        </div>

        {/* Aspect ratio indicator */}
        <ThemedText variant="small" className="opacity-60">
          Aspect ratio: {aspectRatio}
        </ThemedText>
      </div>
    </StepLayout>
  )
}
