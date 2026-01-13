/**
 * Input Multi-Select Renderer
 *
 * Edit-mode renderer for multiple choice steps.
 * Shows question with disabled checkbox options.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'

export function InputMultiSelectRenderer({ config }: StepRendererProps) {
  const { question, options } = config as InputMultiSelectStepConfig

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Question */}
      <p className="text-center text-lg font-medium">
        {question || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Custom checkbox-like div */}
            <div className="h-4 w-4 shrink-0 rounded-sm border border-muted-foreground/50 opacity-50" />
            <span className="text-sm text-muted-foreground">{option}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
