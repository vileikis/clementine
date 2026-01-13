/**
 * Input Short Text Renderer
 *
 * Edit-mode renderer for short text input steps.
 * Shows question with disabled single-line input.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputShortTextStepConfig } from '../schemas/input-short-text.schema'
import { Input } from '@/ui-kit/ui/input'

export function InputShortTextRenderer({ config }: StepRendererProps) {
  const { question, placeholder } = config as InputShortTextStepConfig

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Question */}
      <p className="text-center text-lg font-medium">
        {question || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Input */}
      <Input
        placeholder={placeholder || 'Type your answer...'}
        disabled
        className="max-w-sm"
      />
    </div>
  )
}
