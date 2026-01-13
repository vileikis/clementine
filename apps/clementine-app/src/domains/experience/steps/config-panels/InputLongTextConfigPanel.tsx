/**
 * Input Long Text Config Panel
 *
 * Configuration panel for long text input steps.
 * Fields: question, placeholder, maxLength.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'

export function InputLongTextConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { question, placeholder, maxLength } = config as InputLongTextStepConfig

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => onConfigChange({ question: e.target.value })}
          placeholder="Enter your question..."
          maxLength={200}
          disabled={disabled}
        />
      </div>

      {/* Placeholder */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="placeholder">Placeholder text</Label>
        <Input
          id="placeholder"
          value={placeholder}
          onChange={(e) => onConfigChange({ placeholder: e.target.value })}
          placeholder="e.g., Tell us more..."
          maxLength={200}
          disabled={disabled}
        />
      </div>

      {/* Max length */}
      <div className="flex flex-col gap-2">
        <Label>Maximum length: {maxLength} characters</Label>
        <Slider
          value={[maxLength]}
          onValueChange={([value]) => onConfigChange({ maxLength: value })}
          min={100}
          max={2000}
          step={100}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
