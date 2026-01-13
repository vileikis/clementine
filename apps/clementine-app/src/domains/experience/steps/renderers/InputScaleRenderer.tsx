/**
 * Input Scale Renderer
 *
 * Edit-mode renderer for opinion scale steps.
 * Shows question and disabled scale buttons.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputScaleStepConfig } from '../schemas/input-scale.schema'

export function InputScaleRenderer({ config }: StepRendererProps) {
  const { question, min, max, minLabel, maxLabel } =
    config as InputScaleStepConfig

  // Generate scale values
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Question */}
      <p className="text-center text-lg font-medium">
        {question || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Scale buttons */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {scaleValues.map((value) => (
            <button
              key={value}
              disabled
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-sm font-medium text-muted-foreground"
            >
              {value}
            </button>
          ))}
        </div>

        {/* Labels */}
        {(minLabel || maxLabel) && (
          <div className="flex w-full justify-between text-xs text-muted-foreground">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}
