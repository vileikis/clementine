/**
 * Input Yes/No Config Panel
 *
 * Configuration panel for yes/no question steps.
 * Fields: title, required.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputYesNoStepConfig } from '../schemas/input-yes-no.schema'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'

export function InputYesNoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as InputYesNoStepConfig
  const { title, required } = config

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onConfigChange({ title: e.target.value })}
          placeholder="Enter your yes/no question..."
          maxLength={200}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">
          {title.length}/200 characters
        </span>
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
    </div>
  )
}
