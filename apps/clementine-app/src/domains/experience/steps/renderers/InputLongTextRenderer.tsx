/**
 * Input Long Text Renderer
 *
 * Edit-mode renderer for long text input steps.
 * Shows question with disabled textarea.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { Textarea } from '@/ui-kit/ui/textarea'

export function InputLongTextRenderer({ config }: StepRendererProps) {
  const { question, placeholder } = config as InputLongTextStepConfig

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Question */}
      <p className="text-center text-lg font-medium">
        {question || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Textarea */}
      <Textarea
        placeholder={placeholder || 'Type your answer...'}
        disabled
        className="max-w-sm"
        rows={4}
      />
    </div>
  )
}
