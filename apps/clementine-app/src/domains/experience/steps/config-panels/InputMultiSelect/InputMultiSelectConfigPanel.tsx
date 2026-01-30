/**
 * Input Multi-Select Config Panel
 *
 * Configuration panel for multiple choice steps.
 * Fields: title, required, options, multiSelect.
 * Now includes AI-aware fields: promptFragment and promptMedia.
 */
import { ChoicesSection } from './ChoicesSection'
import type { StepConfigPanelProps } from '../../registry/step-registry'
import type { ExperienceInputMultiSelectStepConfig } from '@clementine/shared'
import { EditorRow, EditorSection, TextField } from '@/shared/editor-controls'
import { Switch } from '@/ui-kit/ui/switch'

export function InputMultiSelectConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputMultiSelectStepConfig
  const { title, required, options, multiSelect } = config

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
        <ChoicesSection
          options={options}
          onOptionsChange={(newOptions) =>
            onConfigChange({ options: newOptions })
          }
          disabled={disabled}
        />
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
