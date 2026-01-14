/**
 * Input Long Text Renderer
 *
 * Renderer for long text input steps.
 * Shows title with textarea using themed styling.
 * Uses StepLayout for responsive layout with submit button.
 */
import { StepLayout } from './StepLayout'
import type { StepRendererProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { ThemedText, ThemedTextarea } from '@/shared/theming'

export function InputLongTextRenderer({ step, onSubmit }: StepRendererProps) {
  const config = step.config as InputLongTextStepConfig
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

        {/* Textarea */}
        <ThemedTextarea
          placeholder={placeholder || 'Type your answer...'}
          disabled
          rows={4}
          className="w-full"
        />
      </div>
    </StepLayout>
  )
}
