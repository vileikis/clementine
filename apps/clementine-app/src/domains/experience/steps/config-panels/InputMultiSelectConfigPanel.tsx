/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: title, required, options, multiSelect.
 */
import { Plus, Trash2 } from 'lucide-react'

import type { StepConfigPanelProps } from '../registry/step-registry'
import type { ExperienceInputMultiSelectStepConfig } from '@clementine/shared'
import { EditorRow, EditorSection, TextField } from '@/shared/editor-controls'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'

export function InputMultiSelectConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, required, options, multiSelect } = config

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], value }
    onConfigChange({ options: newOptions })
  }

  const handleAddOption = () => {
    if (options.length < 10) {
      onConfigChange({
        options: [...options, { value: `Option ${options.length + 1}` }],
      })
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      onConfigChange({ options: newOptions })
    }
  }

  return (
    <div className="space-y-0">
      <EditorSection title="Question">
        <TextField
          label="Title"
          value={title}
          onChange={(value) => onConfigChange({ title: value })}
          placeholder="Enter your question..."
          maxLength={200}
          disabled={disabled}
        />
        <EditorRow label="Required">
          <Switch
            checked={required}
            onCheckedChange={(checked) => onConfigChange({ required: checked })}
            disabled={disabled}
          />
        </EditorRow>
      </EditorSection>

      <EditorSection title="Options">
        <div className="space-y-2">
          <Label className="text-sm font-normal text-muted-foreground">
            Choices ({options.length}/10)
          </Label>
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.value}
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
            >
              <Plus className="mr-2 h-4 w-4" />
              Add option
            </Button>
          )}
        </div>
      </EditorSection>

      <EditorSection title="Behavior">
        <EditorRow label="Allow multiple selections">
          <Switch
            checked={multiSelect}
            onCheckedChange={(checked) =>
              onConfigChange({ multiSelect: checked })
            }
            disabled={disabled}
          />
        </EditorRow>
        <p className="text-xs text-muted-foreground">
          {multiSelect
            ? 'Users can select multiple options'
            : 'Users can only select one option'}
        </p>
      </EditorSection>
    </div>
  )
}
