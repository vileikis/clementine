/**
 * Input Short Text Config Panel
 *
 * Configuration panel for short text input steps.
 * Fields: title, required, placeholder, maxLength.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { ExperienceInputShortTextStepConfig } from '@clementine/shared'
import {
  EditorRow,
  EditorSection,
  SliderField,
  TextField,
} from '@/shared/editor-controls'
import { Switch } from '@/ui-kit/ui/switch'

export function InputShortTextConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceInputShortTextStepConfig
  const { title, required, placeholder, maxLength } = config

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

      <EditorSection title="Input Settings">
        <TextField
          label="Placeholder"
          value={placeholder}
          onChange={(value) => onConfigChange({ placeholder: value })}
          placeholder="e.g., Type your answer..."
          maxLength={100}
          disabled={disabled}
        />
        <SliderField
          label="Max length"
          value={maxLength}
          onChange={(value) => onConfigChange({ maxLength: value })}
          min={10}
          max={200}
          step={10}
          formatValue={(v) => `${v} chars`}
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
