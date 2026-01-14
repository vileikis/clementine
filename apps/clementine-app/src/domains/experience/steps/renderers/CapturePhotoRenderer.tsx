/**
 * Capture Photo Renderer
 *
 * Renderer for photo capture steps.
 * Shows camera placeholder with aspect ratio indicator using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Note: No countdown functionality in this implementation.
 */
import { Camera } from 'lucide-react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function CapturePhotoRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config
  const { theme } = useEventTheme()

  // Calculate dimensions based on aspect ratio
  const isSquare = aspectRatio === '1:1'

  return (
    <StepLayout onSubmit={onSubmit} buttonLabel="Capture">
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
