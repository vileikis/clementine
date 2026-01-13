/**
 * Input Yes/No Renderer
 *
 * Edit-mode renderer for yes/no question steps.
 * Shows question with disabled Yes/No buttons.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { Button } from '@/ui-kit/ui/button'

export function InputYesNoRenderer({ config }: StepRendererProps) {
  const { question } = config as InputYesNoStepConfig

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Question */}
      <p className="text-center text-lg font-medium">
        {question || (
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
