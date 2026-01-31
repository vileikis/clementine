/**
 * Input Scale Renderer
 *
 * Renderer for opinion scale steps.
 * Shows title and scale buttons with themed styling.
 * Uses StepLayout for responsive layout with submit button.
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display with disabled buttons
 * - Run mode: Interactive scale selection with navigation
 */
import { useCallback } from 'react'
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { ExperienceInputScaleStepConfig } from '@clementine/shared'
import { ThemedScaleButton, ThemedText } from '@/shared/theming'

export function InputScaleRenderer({
  step,
  mode,
  answer,
  onAnswer,
  onSubmit,
  onBack,
  canGoBack,
  canProceed,
}: StepRendererProps) {
  const config = step.config as ExperienceInputScaleStepConfig
  const { title, min, max, minLabel, maxLabel } = config

  // Generate scale values as strings
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) =>
    String(min + i),
  )

  // Handle scale button click
  const handleSelect = useCallback(
    (value: string) => {
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
                selected={answer === value}
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
    </StepLayout>
  )
}
