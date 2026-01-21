/**
 * Input Multi-Select Renderer
 *
 * Renderer for multiple choice steps.
 * Shows title with pill-style selectable options using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled options
 * - Run mode: Interactive option selection (single or multi) with navigation
 */
import { useCallback } from 'react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInputMultiSelectStepConfig } from '@clementine/shared'
import { ThemedSelectOption, ThemedText } from '@/shared/theming'

export function InputMultiSelectRenderer({
  step,
  mode,
  answer,
  onAnswer,
  onSubmit,
  onBack,
  canGoBack,
  canProceed,
}: StepRendererProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, options, multiSelect } = config

  // Current selected values (always an array)
  const selectedValues = Array.isArray(answer) ? answer : []

  // Handle option click
  const handleToggle = useCallback(
    (option: string) => {
      if (mode !== 'run' || !onAnswer) return

      if (multiSelect) {
        // Multi-select: toggle the option
        const newSelection = selectedValues.includes(option)
          ? selectedValues.filter((v) => v !== option)
          : [...selectedValues, option]
        onAnswer(newSelection)
      } else {
        // Single-select: replace selection
        onAnswer([option])
      }
    },
    [mode, onAnswer, multiSelect, selectedValues],
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
        <ThemedText variant="heading" as="h2">
          {title ||
            (mode === 'edit' ? (
              <span className="opacity-50">Enter your question...</span>
            ) : null)}
        </ThemedText>

        {/* Options - pill style for both single and multi select */}
        <div className="flex flex-col gap-3 w-full">
          {options.map((option, index) => (
            <ThemedSelectOption
              key={index}
              label={option}
              selected={selectedValues.includes(option)}
              onClick={() => handleToggle(option)}
              disabled={mode === 'edit'}
            />
          ))}
        </div>
      </div>
    </StepLayout>
  )
}
