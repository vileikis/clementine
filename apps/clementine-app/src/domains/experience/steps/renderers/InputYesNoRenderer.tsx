/**
 * Input Yes/No Renderer
 *
 * Renderer for yes/no question steps.
 * Shows title with Yes/No buttons using themed styling.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled buttons
 * - Run mode: Interactive Yes/No selection
 *
 * Navigation is handled by ExperienceRuntime.
 */
import { useCallback } from 'react'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInputYesNoStepConfig } from '@clementine/shared'
import { ThemedButton, ThemedText } from '@/shared/theming'

export function InputYesNoRenderer({
  step,
  mode,
  response,
  onResponseChange,
}: StepRendererProps) {
  const config = step.config as ExperienceInputYesNoStepConfig
  const { title } = config

  // Current value from response data
  const currentValue = response?.data

  // Handle button click
  const handleSelect = useCallback(
    (value: 'yes' | 'no') => {
      if (mode === 'run' && onResponseChange) {
        onResponseChange(value)
      }
    },
    [mode, onResponseChange],
  )

  return (
    <div className="flex flex-col items-center gap-8 w-full px-4">
      {/* Title */}
      <ThemedText variant="heading" as="h2">
        {title ||
          (mode === 'edit' ? (
            <span className="opacity-50">Enter your question...</span>
          ) : null)}
      </ThemedText>

      {/* Yes/No buttons */}
      <div className="flex gap-4">
        <ThemedButton
          variant={currentValue === 'yes' ? 'primary' : 'outline'}
          size="lg"
          className="min-w-24"
          onClick={() => handleSelect('yes')}
          disabled={mode === 'edit'}
        >
          Yes
        </ThemedButton>
        <ThemedButton
          variant={currentValue === 'no' ? 'primary' : 'outline'}
          size="lg"
          className="min-w-24"
          onClick={() => handleSelect('no')}
          disabled={mode === 'edit'}
        >
          No
        </ThemedButton>
      </div>
    </div>
  )
}
