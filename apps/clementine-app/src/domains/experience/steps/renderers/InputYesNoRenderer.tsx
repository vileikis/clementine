/**
 * Input Yes/No Renderer
 *
 * Renderer for yes/no question steps.
 * Shows title with Yes/No buttons using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { ThemedButton, ThemedText } from '@/shared/theming'

export function InputYesNoRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as InputYesNoStepConfig
  const { title } = config

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

        {/* Yes/No buttons */}
        <div className="flex gap-4">
          <ThemedButton variant="outline" size="lg" className="min-w-24">
            Yes
          </ThemedButton>
          <ThemedButton variant="outline" size="lg" className="min-w-24">
            No
          </ThemedButton>
        </div>
      </div>
    </StepLayout>
  )
}
