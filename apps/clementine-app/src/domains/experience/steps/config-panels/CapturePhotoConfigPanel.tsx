/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Fields: aspectRatio.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  AspectRatio,
  CapturePhotoStepConfig,
} from '../schemas/capture-photo.schema'
import type { EditorOption } from '@/shared/editor-controls'
import { EditorSection, SelectField } from '@/shared/editor-controls'

// Aspect ratio options
const ASPECT_RATIO_OPTIONS: EditorOption<AspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
]

export function CapturePhotoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config

  return (
    <div className="space-y-0">
      <EditorSection title="Camera">
        <SelectField
          label="Aspect Ratio"
          value={aspectRatio}
          onChange={(value) => onConfigChange({ aspectRatio: value })}
          options={ASPECT_RATIO_OPTIONS}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          {aspectRatio === '1:1'
            ? 'Best for profile photos and social media posts'
            : 'Best for stories and full-screen mobile displays'}
        </p>
      </EditorSection>
    </div>
  )
}
