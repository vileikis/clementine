/**
 * Input Multi-Select Renderer
 *
 * Edit-mode renderer for multiple choice steps.
 * Shows title with disabled checkbox/radio options.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'

export function InputMultiSelectRenderer({ step }: StepRendererProps) {
  const config = step.config as InputMultiSelectStepConfig
  const { title, options, multiSelect } = config

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Title */}
      <p className="text-center text-lg font-medium">
        {title || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Checkbox/Radio visual indicator */}
            <div
              className={`flex h-4 w-4 items-center justify-center border border-muted-foreground/50 ${
                multiSelect ? 'rounded' : 'rounded-full'
              }`}
            />
            <span className="text-sm text-muted-foreground">{option}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
