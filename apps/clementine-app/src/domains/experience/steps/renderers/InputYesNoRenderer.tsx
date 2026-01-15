/**
 * Input Yes/No Renderer
 *
 * Renderer for yes/no question steps.
 * Shows title with Yes/No buttons using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled buttons
 * - Run mode: Interactive Yes/No selection with navigation
 */
import { useCallback } from 'react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { ThemedButton, ThemedText } from '@/shared/theming'

export function InputYesNoRenderer({
  step,
  mode,
  answer,
  onAnswer,
  onSubmit,
  onBack,
  canGoBack,
  canProceed,
}: StepRendererProps) {
  const config = step.config as InputYesNoStepConfig
  const { title } = config

  // Current selected value
  const selectedValue = typeof answer === 'boolean' ? answer : undefined

  // Handle button click
  const handleSelect = useCallback(
    (value: boolean) => {
      if (mode === 'run' && onAnswer) {
        onAnswer(value)
      }
    },
    [mode, onAnswer],
  )

  return (
    <StepLayout
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
      canProceed={canProceed}
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        {/* Title */}
        <ThemedText
          variant="body"
          as="p"
          className="text-center text-lg font-medium"
        >
          {title ||
            (mode === 'edit' ? (
              <span className="opacity-50">Enter your question...</span>
            ) : null)}
        </ThemedText>

        {/* Yes/No buttons */}
        <div className="flex gap-4">
          <ThemedButton
            variant={selectedValue === true ? 'primary' : 'outline'}
            size="lg"
            className="min-w-24"
            onClick={() => handleSelect(true)}
            disabled={mode === 'edit'}
          >
            Yes
          </ThemedButton>
          <ThemedButton
            variant={selectedValue === false ? 'primary' : 'outline'}
            size="lg"
            className="min-w-24"
            onClick={() => handleSelect(false)}
            disabled={mode === 'edit'}
          >
            No
          </ThemedButton>
        </div>
      </div>
    </StepLayout>
  )
}
