/**
 * Info Step Config Panel
 *
 * Configuration panel for info/display steps.
 * Fields: title, description, media.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { InfoStepConfig } from '../schemas/info.schema'
import {
  EditorSection,
  MediaPickerField,
  TextField,
  TextareaField,
} from '@/shared/editor-controls'

export function InfoStepConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as InfoStepConfig
  const { title, description } = config

  return (
    <div className="space-y-0">
      <EditorSection title="Content">
        <TextField
          label="Title"
          value={title}
          onChange={(value) => onConfigChange({ title: value })}
          placeholder="Enter title..."
          maxLength={200}
          disabled={disabled}
        />
        <TextareaField
          label="Description"
          value={description || null}
          onChange={(value) => onConfigChange({ description: value ?? '' })}
          placeholder="Enter description..."
          maxLength={1000}
          rows={4}
          disabled={disabled}
        />
        <MediaPickerField
          label="Media"
          value={config.media?.url ?? null}
          onChange={(value) =>
            onConfigChange({
              media: value === null ? null : config.media,
            })
          }
          onUpload={() => {
            // Media picker coming soon - placeholder
          }}
          accept="image/*"
          removable
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
