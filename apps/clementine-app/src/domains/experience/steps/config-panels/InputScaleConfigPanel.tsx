/**
 * Input Scale Config Panel
 *
 * Configuration panel for opinion scale steps.
 * Fields: question, min, max, minLabel, maxLabel.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputScaleStepConfig } from '../schemas/input-scale.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'

export function InputScaleConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { question, min, max, minLabel, maxLabel } =
    config as InputScaleStepConfig

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

      {/* Min value */}
      <div className="flex flex-col gap-2">
        <Label>Minimum value: {min}</Label>
        <Slider
          value={[min]}
          onValueChange={([value]) => onConfigChange({ min: value })}
          min={0}
          max={9}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Max value */}
      <div className="flex flex-col gap-2">
        <Label>Maximum value: {max}</Label>
        <Slider
          value={[max]}
          onValueChange={([value]) => onConfigChange({ max: value })}
          min={1}
          max={10}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Min label */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="minLabel">Minimum label</Label>
        <Input
          id="minLabel"
          value={minLabel ?? ''}
          onChange={(e) =>
            onConfigChange({ minLabel: e.target.value || undefined })
          }
          placeholder="e.g., Poor"
          maxLength={50}
          disabled={disabled}
        />
      </div>

      {/* Max label */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="maxLabel">Maximum label</Label>
        <Input
          id="maxLabel"
          value={maxLabel ?? ''}
          onChange={(e) =>
            onConfigChange({ maxLabel: e.target.value || undefined })
          }
          placeholder="e.g., Excellent"
          maxLength={50}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
