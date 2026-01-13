/**
 * Input Long Text Renderer
 *
 * Edit-mode renderer for long text input steps.
 * Shows title with disabled textarea.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { Textarea } from '@/ui-kit/ui/textarea'

export function InputLongTextRenderer({ step }: StepRendererProps) {
  const config = step.config as InputLongTextStepConfig
  const { title, placeholder } = config

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Title */}
      <p className="text-center text-lg font-medium">
        {title || (
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
