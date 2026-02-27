/**
 * PhotoConfigForm Component
 *
 * Configuration form for Photo outcome type.
 * Renders SubjectMediaSection (captureStepId) and AspectRatioSelector.
 *
 * @see specs/072-outcome-schema-redesign — US1
 */
import { getFieldError } from '../../hooks/useExperienceConfigValidation'
import { SubjectMediaSection } from '../shared-controls/SubjectMediaSection'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'
import type { FieldValidationError } from '../../hooks/useExperienceConfigValidation'
import type {
  AspectRatio,
  ExperienceStep,
  PhotoConfig,
} from '@clementine/shared'

export interface PhotoConfigFormProps {
  /** Photo configuration */
  config: PhotoConfig
  /** Callback when config changes */
  onConfigChange: (updates: Partial<PhotoConfig>) => void
  /** Experience steps */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
  /** Callback when a capture step's aspect ratio is changed inline */
  onCaptureAspectRatioChange?: (
    stepId: string,
    aspectRatio: AspectRatio,
  ) => void
}

/**
 * PhotoConfigForm - Source image + aspect ratio for photo output
 */
export function PhotoConfigForm({
  config,
  onConfigChange,
  steps,
  errors,
  onCaptureAspectRatioChange,
}: PhotoConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Subject Media section */}
      <SubjectMediaSection
        captureStepId={config.captureStepId || null}
        steps={steps}
        onCaptureStepChange={(captureStepId) =>
          onConfigChange({ captureStepId: captureStepId ?? '' })
        }
        onCaptureAspectRatioChange={onCaptureAspectRatioChange}
        error={getFieldError(errors, 'photo.captureStepId')}
      />

      {/* Output section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Output</h3>
        <AspectRatioSelector
          value={config.aspectRatio}
          onChange={(aspectRatio) =>
            onConfigChange({ aspectRatio: aspectRatio })
          }
        />
      </div>
    </div>
  )
}
