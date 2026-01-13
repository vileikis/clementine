/**
 * Input Yes/No Config Panel
 *
 * Configuration panel for yes/no question steps.
 * Fields: question.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

export function InputYesNoConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { question } = config as InputYesNoStepConfig

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => onConfigChange({ question: e.target.value })}
          placeholder="Enter your yes/no question..."
          maxLength={200}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">
          {question.length}/200 characters
        </span>
      </div>
    </div>
  )
}
