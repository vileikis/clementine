/**
 * Capture Photo Edit Mode
 *
 * Preview-only display for the experience designer.
 * Shows camera placeholder with aspect ratio indicator.
 */

import { Camera } from 'lucide-react'
import { StepLayout } from '../StepLayout'
import { ThemedText, useEventTheme } from '@/shared/theming'

interface CapturePhotoEditModeProps {
  aspectRatio: '1:1' | '9:16'
}

export function CapturePhotoEditMode({
  aspectRatio,
}: CapturePhotoEditModeProps) {
  const { theme } = useEventTheme()
  const isSquare = aspectRatio === '1:1'

  return (
    <StepLayout hideButton>
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Camera placeholder with aspect ratio */}
        <div
          className={`flex flex-col items-center justify-center rounded-lg ${
            isSquare ? 'h-64 w-64' : 'h-80 w-44'
          }`}
          style={{
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
