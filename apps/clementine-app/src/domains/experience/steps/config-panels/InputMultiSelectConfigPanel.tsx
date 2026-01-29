/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: title, required, options, multiSelect.
 * Now includes AI-aware fields: promptFragment and promptMedia.
 */
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PromptFragmentInput, PromptMediaPicker } from './components'
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  ExperienceInputMultiSelectStepConfig,
  MultiSelectOption,
} from '@clementine/shared'
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

  // Track which option's AI fields are expanded
  const [expandedOption, setExpandedOption] = useState<number | null>(null)

  const handleOptionChange = (
    index: number,
    updates: Partial<MultiSelectOption>,
  ) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
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
          <Label className="text-sm font-normal text-muted-foreground">
            Choices ({options.length}/10)
          </Label>
          <div className="flex flex-col gap-3">
            {options.map((option, index) => {
              const isExpanded = expandedOption === index
              const hasAIContext = !!(
                option.promptFragment || option.promptMedia
              )

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border p-3 space-y-3"
                >
                  {/* Option value and controls */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={option.value}
                      onChange={(e) =>
                        handleOptionChange(index, { value: e.target.value })
                      }
                      placeholder={`Option ${index + 1}`}
                      maxLength={100}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(index)}
                      disabled={disabled}
                      title={isExpanded ? 'Hide AI fields' : 'Show AI fields'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
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

                  {/* AI Context indicator when collapsed */}
                  {!isExpanded && hasAIContext && (
                    <div className="text-xs text-muted-foreground">
                      ✨ AI context added
                    </div>
                  )}

                  {/* AI Fields (expanded) */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t">
                      <PromptFragmentInput
                        value={option.promptFragment}
                        onChange={(value) =>
                          handleOptionChange(index, { promptFragment: value })
                        }
                        disabled={disabled}
                      />
                      <PromptMediaPicker
                        value={option.promptMedia}
                        onChange={(value) =>
                          handleOptionChange(index, { promptMedia: value })
                        }
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
              )
            })}
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
