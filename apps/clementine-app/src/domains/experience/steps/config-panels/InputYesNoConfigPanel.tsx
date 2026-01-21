/**
 * Input Yes/No Config Panel
 *
 * Configuration panel for yes/no question steps.
 * Fields: title, required.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { ExperienceInputYesNoStepConfig } from '@clementine/shared'
import { EditorRow, EditorSection, TextField } from '@/shared/editor-controls'
import { Switch } from '@/ui-kit/ui/switch'

export function InputYesNoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputYesNoStepConfig
  const { title, required } = config

  return (
    <div className="space-y-0">
      <EditorSection title="Question">
        <TextField
          label="Title"
          value={title}
          onChange={(value) => onConfigChange({ title: value })}
          placeholder="Enter your yes/no question..."
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
    </div>
  )
}
