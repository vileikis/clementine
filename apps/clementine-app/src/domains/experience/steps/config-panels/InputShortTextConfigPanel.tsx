/**
 * Input Short Text Config Panel
 *
 * Configuration panel for short text input steps.
 * Fields: question, placeholder, maxLength.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputShortTextStepConfig } from '../schemas/input-short-text.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'

export function InputShortTextConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { question, placeholder, maxLength } =
    config as InputShortTextStepConfig

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
          placeholder="e.g., Type your answer..."
          maxLength={100}
          disabled={disabled}
        />
      </div>

      {/* Max length */}
      <div className="flex flex-col gap-2">
        <Label>Maximum length: {maxLength} characters</Label>
        <Slider
          value={[maxLength]}
          onValueChange={([value]) => onConfigChange({ maxLength: value })}
          min={10}
          max={200}
          step={10}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
