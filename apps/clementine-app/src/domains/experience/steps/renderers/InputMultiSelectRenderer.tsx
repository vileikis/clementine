/**
 * Input Multi-Select Renderer
 *
 * Renderer for multiple choice steps.
 * Shows title with pill-style selectable options using themed styling.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled options
 * - Run mode: Interactive option selection (single or multi)
 *
 * Navigation is handled by ExperienceRuntime.
 */
import { useCallback } from 'react'
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
}: StepRendererProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, options, multiSelect } = config

  // Current selected options from response.data (MultiSelectOption[])
  const selectedOptions: MultiSelectOption[] = Array.isArray(response?.data)
    ? (response.data as MultiSelectOption[])
    : []

  // Helper to check if an option is selected
  const isOptionSelected = useCallback(
    (optionValue: string) => {
      return selectedOptions.some((selected) => selected.value === optionValue)
    },
    [selectedOptions],
  )

  // Handle option click - store full MultiSelectOption[] as data
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

      // Store full options array as data
      onResponseChange(newOptions)
    },
    [mode, onResponseChange, multiSelect, selectedOptions, isOptionSelected],
  )

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md px-4">
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
  )
}
