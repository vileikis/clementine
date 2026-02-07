/**
 * Input Scale Renderer
 *
 * Renderer for opinion scale steps.
 * Shows title and scale buttons with themed styling.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled buttons
 * - Run mode: Interactive scale selection
 *
 * Navigation is handled by ExperienceRuntime.
 */
import { useCallback } from 'react'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInputScaleStepConfig } from '@clementine/shared'
import { ThemedScaleButton, ThemedText } from '@/shared/theming'

export function InputScaleRenderer({
  step,
  mode,
  response,
  onResponseChange,
}: StepRendererProps) {
  const config = step.config as ExperienceInputScaleStepConfig
  const { title, min, max, minLabel, maxLabel } = config

  // Current value from response data
  const currentValue = response?.data

  // Generate scale values as strings
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) =>
    String(min + i),
  )

  // Handle scale button click
  const handleSelect = useCallback(
    (value: string) => {
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

      {/* Scale buttons - wrap to fit available space */}
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-3">
          {scaleValues.map((value) => (
            <ThemedScaleButton
              key={value}
              value={Number(value)}
              selected={currentValue === value}
              onClick={() => handleSelect(value)}
              disabled={mode === 'edit'}
            />
          ))}
        </div>

        {/* Labels */}
        {(minLabel || maxLabel) && (
          <div className="flex w-full justify-between px-2">
            <ThemedText variant="small">{minLabel}</ThemedText>
            <ThemedText variant="small">{maxLabel}</ThemedText>
          </div>
        )}
      </div>
    </div>
  )
}
