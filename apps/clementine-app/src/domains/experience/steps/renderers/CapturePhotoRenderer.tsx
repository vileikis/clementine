/**
 * Capture Photo Renderer
 *
 * Renderer for photo capture steps.
 * Shows camera placeholder with aspect ratio indicator using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display of camera placeholder
 * - Run mode: Placeholder with "Coming soon" - allows Continue to skip
 *
 * Note: Full camera integration deferred to E5.2
 */
import { Camera } from 'lucide-react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function CapturePhotoRenderer({
  step,
  mode,
  onSubmit,
  onBack,
  canGoBack,
}: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config
  const { theme } = useEventTheme()

  // Calculate dimensions based on aspect ratio
  const isSquare = aspectRatio === '1:1'

  // Placeholder steps are always valid
  const canProceed = true

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={canProceed}
      buttonLabel={mode === 'run' ? 'Skip' : 'Capture'}
    >
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

        {/* Coming soon badge in run mode */}
        {mode === 'run' && (
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 20%, transparent)`,
              color: theme.primaryColor,
            }}
          >
            Camera capture coming soon
          </span>
        )}

        {/* Aspect ratio indicator (edit mode only) */}
        {mode === 'edit' && (
          <ThemedText variant="small" className="opacity-60">
            Aspect ratio: {aspectRatio}
          </ThemedText>
        )}
      </div>
    </StepLayout>
  )
}
