/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: title, required, options, multiSelect.
 */
import { Plus, Trash2 } from 'lucide-react'
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'

export function InputMultiSelectConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as InputMultiSelectStepConfig
  const { title, required, options, multiSelect } = config

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    onConfigChange({ options: newOptions })
  }

  const handleAddOption = () => {
    if (options.length < 10) {
      onConfigChange({ options: [...options, `Option ${options.length + 1}`] })
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      onConfigChange({ options: newOptions })
    }
  }

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

      {/* Options */}
      <div className="flex flex-col gap-2">
        <Label>Options ({options.length}/10)</Label>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={100}
                disabled={disabled}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOption(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={disabled}
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add option
          </Button>
        )}
      </div>

      {/* Multi-select toggle */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Label htmlFor="multiSelect">Allow multiple selections</Label>
          <span className="text-xs text-muted-foreground">
            {multiSelect
              ? 'Users can select multiple options'
              : 'Users can only select one option'}
          </span>
        </div>
        <Switch
          id="multiSelect"
          checked={multiSelect}
          onCheckedChange={(checked) =>
            onConfigChange({ multiSelect: checked })
          }
          disabled={disabled}
        />
      </div>
    </div>
  )
}
