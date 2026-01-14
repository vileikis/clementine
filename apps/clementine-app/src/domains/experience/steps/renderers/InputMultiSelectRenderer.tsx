/**
 * Input Multi-Select Renderer
 *
 * Renderer for multiple choice steps.
 * Shows title with checkbox/radio options using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'
import { ThemedCheckbox, ThemedRadio, ThemedText } from '@/shared/theming'

export function InputMultiSelectRenderer({
  step,
  onSubmit,
}: StepRendererProps) {
  const config = step.config as InputMultiSelectStepConfig
  const { title, options, multiSelect } = config

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

        {/* Options */}
        <div className="flex flex-col gap-2 w-full">
          {options.map((option, index) =>
            multiSelect ? (
              <ThemedCheckbox
                key={index}
                label={option}
                disabled
                checked={false}
              />
            ) : (
              <ThemedRadio
                key={index}
                name={`option-${step.id}`}
                value={option}
                label={option}
                disabled
                checked={false}
              />
            ),
          )}
        </div>
      </div>
    </StepLayout>
  )
}
