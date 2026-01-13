/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: question, options, minSelect, maxSelect.
 */
import { Plus, Trash2 } from 'lucide-react'
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InputMultiSelectStepConfig } from '../schemas/input-multi-select.schema'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Slider } from '@/ui-kit/ui/slider'

export function InputMultiSelectConfigPanel({
  config,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const { question, options, minSelect, maxSelect } =
    config as InputMultiSelectStepConfig

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

      {/* Min selections */}
      <div className="flex flex-col gap-2">
        <Label>Minimum selections: {minSelect}</Label>
        <Slider
          value={[minSelect]}
          onValueChange={([value]) => onConfigChange({ minSelect: value })}
          min={0}
          max={options.length}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Max selections */}
      <div className="flex flex-col gap-2">
        <Label>Maximum selections: {maxSelect ?? options.length}</Label>
        <Slider
          value={[maxSelect ?? options.length]}
          onValueChange={([value]) => onConfigChange({ maxSelect: value })}
          min={minSelect || 1}
          max={options.length}
          step={1}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
