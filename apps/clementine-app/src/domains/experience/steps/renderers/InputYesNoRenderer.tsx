/**
 * Input Yes/No Renderer
 *
 * Edit-mode renderer for yes/no question steps.
 * Shows title with disabled Yes/No buttons.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { Button } from '@/ui-kit/ui/button'

export function InputYesNoRenderer({ step }: StepRendererProps) {
  const config = step.config as InputYesNoStepConfig
  const { title } = config

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Title */}
      <p className="text-center text-lg font-medium">
        {title || (
          <span className="text-muted-foreground">Enter your question...</span>
        )}
      </p>

      {/* Yes/No buttons */}
      <div className="flex gap-4">
        <Button variant="outline" size="lg" disabled className="min-w-24">
          Yes
        </Button>
        <Button variant="outline" size="lg" disabled className="min-w-24">
          No
        </Button>
      </div>
    </div>
  )
}
