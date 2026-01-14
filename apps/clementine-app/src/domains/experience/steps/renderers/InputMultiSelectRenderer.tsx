/**
 * Input Multi-Select Renderer
 *
 * Renderer for multiple choice steps.
 * Shows title with pill-style selectable options using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'
import { ThemedSelectOption, ThemedText } from '@/shared/theming'

export function InputMultiSelectRenderer({
  step,
  onSubmit,
}: StepRendererProps) {
  const config = step.config as InputMultiSelectStepConfig
  const { title, options } = config

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

        {/* Options - pill style for both single and multi select */}
        <div className="flex flex-col gap-3 w-full">
          {options.map((option, index) => (
            <ThemedSelectOption key={index} label={option} selected={false} />
          ))}
        </div>
      </div>
    </StepLayout>
  )
}
