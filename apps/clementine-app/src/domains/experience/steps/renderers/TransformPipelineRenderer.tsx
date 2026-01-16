/**
 * Transform Pipeline Renderer
 *
 * Renderer for AI transform steps.
 * Shows "AI Processing" placeholder with "Coming soon" badge using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display (no button)
 * - Run mode: Placeholder with Skip button to continue
 *
 * Note: Full transform processing deferred to E9
 */
import { Sparkles } from 'lucide-react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import { ThemedText, useEventTheme } from '@/shared/theming'

export function TransformPipelineRenderer({
  mode,
  onSubmit,
  onBack,
  canGoBack,
}: StepRendererProps) {
  const { theme } = useEventTheme()

  // Placeholder steps are always valid
  const canProceed = true

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={canProceed}
      hideButton={mode === 'edit'}
      buttonLabel="Skip"
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">
        {/* Icon */}
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
          }}
        >
          <Sparkles
            className="h-10 w-10"
            style={{ color: theme.text.color, opacity: 0.6 }}
          />
        </div>

        {/* Title */}
        <ThemedText variant="heading" as="h3">
          AI Processing
        </ThemedText>

        {/* Badge */}
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 20%, transparent)`,
            color: theme.primaryColor,
          }}
        >
          Coming soon
        </span>

        {/* Description */}
        <ThemedText variant="body" className="opacity-80">
          {mode === 'run'
            ? 'AI transformation is not yet available. Click Skip to continue.'
            : 'AI transformation will process your captured media using the configured pipeline.'}
        </ThemedText>
      </div>
    </StepLayout>
  )
}
