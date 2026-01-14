/**
 * Info Step Renderer
 *
 * Renderer for info/display steps.
 * Shows title, description, and media with themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InfoStepConfig } from '../schemas/info.schema'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function InfoStepRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as InfoStepConfig
  const { title, description, media } = config
  const { theme } = useEventTheme()

  return (
    <StepLayout onSubmit={onSubmit}>
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
        {/* Media */}
        {media ? (
          <img
            src={media.url}
            alt=""
            className="max-h-48 w-auto rounded-lg object-contain"
          />
        ) : (
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
        )}

        {/* Title */}
        <ThemedText variant="heading" as="h2">
          {title || <span className="opacity-50">Add a title...</span>}
        </ThemedText>

        {/* Description */}
        <ThemedText variant="body" className="opacity-90">
          {description || (
            <span className="opacity-50">Add a description...</span>
          )}
        </ThemedText>
      </div>
    </StepLayout>
  )
}
