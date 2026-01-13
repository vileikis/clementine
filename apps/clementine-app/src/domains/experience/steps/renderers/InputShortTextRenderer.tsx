/**
 * Input Short Text Renderer
 *
 * Edit-mode renderer for short text input steps.
 * Shows title with disabled single-line input.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputShortTextStepConfig } from '../schemas/input-short-text.schema'
import { Input } from '@/ui-kit/ui/input'

export function InputShortTextRenderer({ step }: StepRendererProps) {
  const config = step.config as InputShortTextStepConfig
  const { title, placeholder } = config

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Title */}
      <p className="text-center text-lg font-medium">
        {title || (
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
