/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: title, required, options, multiSelect.
 * Now includes AI-aware fields: promptFragment and promptMedia.
 */
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { OptionListItem } from './components'
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  ExperienceInputMultiSelectStepConfig,
  MultiSelectOption,
} from '@clementine/shared'
import { EditorRow, EditorSection, TextField } from '@/shared/editor-controls'
import { Button } from '@/ui-kit/ui/button'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'

export function InputMultiSelectConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, required, options, multiSelect } = config

  // Track which option's AI fields are expanded
  const [expandedOption, setExpandedOption] = useState<number | null>(null)

  const handleOptionChange = (
    index: number,
    updates: Partial<MultiSelectOption>,
  ) => {
    const newOptions = [...options]
    const currentOption = newOptions[index]

    // Create updated option, removing undefined values (Firestore doesn't support undefined)
    const updatedOption: MultiSelectOption = { ...currentOption }

    // Handle each update, converting undefined to field deletion
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        // Remove the key from the object (Firestore doesn't support undefined)
        delete (updatedOption as any)[key]
      } else {
        ;(updatedOption as any)[key] = value
      }
    })

    newOptions[index] = updatedOption
    onConfigChange({ options: newOptions })
  }

  const handleAddOption = () => {
    if (options.length < 10) {
      onConfigChange({
        options: [...options, { value: `Option ${options.length + 1}` }],
      })
    }
  }

  const handleDuplicateOption = (index: number) => {
    if (options.length < 10) {
      const optionToDuplicate = options[index]
      const newOption = {
        ...optionToDuplicate,
        value: `${optionToDuplicate.value} (copy)`,
      }
      const newOptions = [
        ...options.slice(0, index + 1),
        newOption,
        ...options.slice(index + 1),
      ]
      onConfigChange({ options: newOptions })
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      onConfigChange({ options: newOptions })
      // Close expanded section if removing that option
      if (expandedOption === index) {
        setExpandedOption(null)
      } else if (expandedOption !== null && expandedOption > index) {
        setExpandedOption(expandedOption - 1)
      }
    }
  }

  const toggleExpanded = (index: number) => {
    setExpandedOption(expandedOption === index ? null : index)
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
          {/* Header with label and add button */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal text-muted-foreground">
              Choices ({options.length}/10)
            </Label>
            {options.length < 10 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleAddOption}
                disabled={disabled}
                title="Add option"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Options list */}
          <div>
            {options.map((option, index) => (
              <OptionListItem
                key={index}
                option={option}
                index={index}
                isExpanded={expandedOption === index}
                canDelete={options.length > 2}
                disabled={disabled}
                onValueChange={(value) => handleOptionChange(index, { value })}
                onToggleExpanded={() => toggleExpanded(index)}
                onDuplicate={() => handleDuplicateOption(index)}
                onDelete={() => handleRemoveOption(index)}
                onPromptFragmentChange={(value) =>
                  handleOptionChange(index, { promptFragment: value })
                }
                onPromptMediaChange={(value) =>
                  handleOptionChange(index, { promptMedia: value })
                }
              />
            ))}
          </div>
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
