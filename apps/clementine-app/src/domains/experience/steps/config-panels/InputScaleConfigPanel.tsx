/**
 * Input Scale Config Panel
 *
 * Configuration panel for opinion scale steps.
 * Fields: title, required, min, max, minLabel, maxLabel.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { ExperienceInputScaleStepConfig } from '@clementine/shared'
import type { EditorOption } from '@/shared/editor-controls'
import {
  EditorRow,
  EditorSection,
  SelectField,
  TextField,
} from '@/shared/editor-controls'
import { Switch } from '@/ui-kit/ui/switch'

// Minimum value options (0-1)
const MIN_OPTIONS: EditorOption<string>[] = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
]

// Maximum value options (5-10)
const MAX_OPTIONS: EditorOption<string>[] = [
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
]

export function InputScaleConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputScaleStepConfig
  const { title, required, min, max, minLabel, maxLabel } = config

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

      <EditorSection title="Scale Range">
        <SelectField
          label="Minimum"
          value={String(min)}
          onChange={(value) => onConfigChange({ min: Number(value) })}
          options={MIN_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Maximum"
          value={String(max)}
          onChange={(value) => onConfigChange({ max: Number(value) })}
          options={MAX_OPTIONS}
          disabled={disabled}
        />
      </EditorSection>

      <EditorSection title="Labels">
        <TextField
          label="Minimum label"
          value={minLabel ?? ''}
          onChange={(value) => onConfigChange({ minLabel: value || undefined })}
          placeholder="e.g., Poor"
          maxLength={50}
          disabled={disabled}
        />
        <TextField
          label="Maximum label"
          value={maxLabel ?? ''}
          onChange={(value) => onConfigChange({ maxLabel: value || undefined })}
          placeholder="e.g., Excellent"
          maxLength={50}
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
