/**
 * Info Step Renderer
 *
 * Renderer for info/display steps.
 * Shows title, description, and media with themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display for designer
 * - Run mode: Interactive display with navigation (Continue/Back)
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInfoStepConfig } from '@clementine/shared'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function InfoStepRenderer({
  step,
  mode,
  onSubmit,
  onBack,
  canGoBack,
}: StepRendererProps) {
  const config = step.config as ExperienceInfoStepConfig
  const { title, description, media } = config
  const { theme } = useEventTheme()

  // Info steps are always valid (no input required)
  const canProceed = true

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={canProceed}
    >
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
        {/* Media */}
        {media ? (
          <img
            src={media.url}
            alt=""
            className="max-h-48 w-auto rounded-lg object-contain"
          />
        ) : mode === 'edit' ? (
          <div
            className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed"
            style={{
              borderColor: `color-mix(in srgb, ${theme.text.color} 25%, transparent)`,
            }}
          >
            <ThemedText variant="small" className="opacity-60">
              No media
            </ThemedText>
          </div>
        ) : null}

        {/* Title */}
        <ThemedText variant="heading" as="h2">
          {title ||
            (mode === 'edit' ? (
              <span className="opacity-50">Add a title...</span>
            ) : null)}
        </ThemedText>

        {/* Description */}
        <ThemedText variant="body" className="opacity-90">
          {description ||
            (mode === 'edit' ? (
              <span className="opacity-50">Add a description...</span>
            ) : null)}
        </ThemedText>
      </div>
    </StepLayout>
  )
}
