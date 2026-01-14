/**
 * Input Scale Renderer
 *
 * Renderer for opinion scale steps.
 * Shows title and scale buttons with themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputScaleStepConfig } from '../schemas/input-scale.schema'
import { ThemedScaleButton, ThemedText } from '@/shared/theming'

export function InputScaleRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as InputScaleStepConfig
  const { title, min, max, minLabel, maxLabel } = config

  // Generate scale values
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <StepLayout onSubmit={onSubmit}>
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        {/* Title */}
        <ThemedText
          variant="body"
          as="p"
          className="text-center text-lg font-medium"
        >
          {title || <span className="opacity-50">Enter your question...</span>}
        </ThemedText>

        {/* Scale buttons - wrap to fit available space */}
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            {scaleValues.map((value) => (
              <ThemedScaleButton key={value} value={value} />
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
