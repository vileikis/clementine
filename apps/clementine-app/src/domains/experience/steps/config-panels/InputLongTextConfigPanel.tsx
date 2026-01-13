/**
 * Input Long Text Config Panel
 *
 * Configuration panel for long text input steps.
 * Fields: title, required, placeholder, maxLength.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputLongTextStepConfig } from '../schemas/input-long-text.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'
import { Switch } from '@/ui-kit/ui/switch'

export function InputLongTextConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as InputLongTextStepConfig
  const { title, required, placeholder, maxLength } = config

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onConfigChange({ title: e.target.value })}
          placeholder="Enter your question..."
          maxLength={200}
          disabled={disabled}
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="required">Required</Label>
        <Switch
          id="required"
          checked={required}
          onCheckedChange={(checked) => onConfigChange({ required: checked })}
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
