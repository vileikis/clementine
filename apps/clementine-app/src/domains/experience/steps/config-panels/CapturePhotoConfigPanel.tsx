/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Fields: aspectRatio.
 */
import type { StepConfigPanelProps } from '../registry/step-registry'
import type {
  ExperienceAspectRatio,
  ExperienceCapturePhotoStepConfig,
} from '@clementine/shared'
import type { EditorOption } from '@/shared/editor-controls'
import { EditorSection, SelectField } from '@/shared/editor-controls'

// Aspect ratio options
const ASPECT_RATIO_OPTIONS: EditorOption<ExperienceAspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '2:3', label: 'Tall Portrait (2:3)' },
]

export function CapturePhotoConfigPanel({
  step,
  onConfigChange,
  disabled,
}: StepConfigPanelProps) {
  const config = step.config as ExperienceCapturePhotoStepConfig
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
          {aspectRatio === '1:1' &&
            'Best for profile photos and social media posts'}
          {aspectRatio === '9:16' &&
            'Best for stories and full-screen mobile displays'}
          {aspectRatio === '3:2' &&
            'Best for landscape photos and traditional DSLR-style shots'}
          {aspectRatio === '2:3' &&
            'Best for portrait photos with more vertical space'}
        </p>
      </EditorSection>
    </div>
  )
}
