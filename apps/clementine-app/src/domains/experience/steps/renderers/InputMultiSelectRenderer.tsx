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
import type {
  ExperienceInputMultiSelectStepConfig,
  MultiSelectOption,
} from '@clementine/shared'
import { ThemedSelectOption, ThemedText } from '@/shared/theming'

export function InputMultiSelectRenderer({
  step,
  mode,
  response,
  onResponseChange,
  onSubmit,
  onBack,
  canGoBack,
  canProceed,
}: StepRendererProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, options, multiSelect } = config

  // Current selected options from response.context (MultiSelectOption[])
  // Fall back to building from response.value (string[]) for backward compatibility
  const selectedOptions: MultiSelectOption[] = response?.context
    ? (response.context as MultiSelectOption[])
    : Array.isArray(response?.value) && typeof response.value[0] === 'string'
      ? response.value.map((val: string) => {
          // Find full option object from value
          const fullOption = options.find((opt) => opt.value === val)
          return (
            fullOption || {
              value: val,
              promptFragment: null,
              promptMedia: null,
            }
          )
        })
      : []

  // Helper to check if an option is selected
  const isOptionSelected = useCallback(
    (optionValue: string) => {
      return selectedOptions.some((selected) => selected.value === optionValue)
    },
    [selectedOptions],
  )

  // Handle option click - split into value (string[]) and context (MultiSelectOption[])
  const handleToggle = useCallback(
    (option: MultiSelectOption) => {
      if (mode !== 'run' || !onResponseChange) return

      let newOptions: MultiSelectOption[]

      if (multiSelect) {
        // Multi-select: toggle the option
        const isSelected = isOptionSelected(option.value)
        newOptions = isSelected
          ? selectedOptions.filter((opt) => opt.value !== option.value)
          : [...selectedOptions, option]
      } else {
        // Single-select: replace selection with this option
        newOptions = [option]
      }

      // Split into value (string[]) and context (MultiSelectOption[])
      const values = newOptions.map((opt) => opt.value)
      onResponseChange(values, newOptions)
    },
    [mode, onResponseChange, multiSelect, selectedOptions, isOptionSelected],
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
              label={option.value}
              selected={isOptionSelected(option.value)}
              onClick={() => handleToggle(option)}
            />
          ))}
        </div>
      </div>
    </StepLayout>
  )
}
