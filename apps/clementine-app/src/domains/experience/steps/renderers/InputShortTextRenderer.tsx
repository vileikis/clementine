/**
 * Input Short Text Renderer
 *
 * Renderer for short text input steps.
 * Shows title with single-line input using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputShortTextStepConfig } from '../schemas/input-short-text.schema'
import { ThemedInput, ThemedText } from '@/shared/theming'

export function InputShortTextRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as InputShortTextStepConfig
  const { title, placeholder } = config

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

        {/* Input */}
        <ThemedInput
          placeholder={placeholder || 'Type your answer...'}
          disabled
          className="w-full"
        />
      </div>
    </StepLayout>
  )
}
