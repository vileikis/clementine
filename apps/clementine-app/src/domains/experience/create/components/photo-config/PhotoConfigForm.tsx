/**
 * PhotoConfigForm Component
 *
 * Configuration form for Photo outcome type.
 * Renders SourceImageSelector (captureStepId) and AspectRatioSelector.
 *
 * @see specs/072-outcome-schema-redesign — US1
 */
import type {
  AspectRatio,
  ExperienceStep,
  PhotoOutcomeConfig,
} from '@clementine/shared'
import type { FieldValidationError } from '../../hooks/useOutcomeValidation'
import { getFieldError } from '../../hooks/useOutcomeValidation'
import { SourceImageSelector } from '../shared-controls/SourceImageSelector'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'

export interface PhotoConfigFormProps {
  /** Photo outcome configuration */
  config: PhotoOutcomeConfig
  /** Callback when config changes */
  onConfigChange: (updates: Partial<PhotoOutcomeConfig>) => void
  /** Experience steps */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
}

/**
 * PhotoConfigForm - Source image + aspect ratio for photo output
 */
export function PhotoConfigForm({
  config,
  onConfigChange,
  steps,
  errors,
}: PhotoConfigFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SourceImageSelector
        value={config.captureStepId || null}
        onChange={(captureStepId) =>
          onConfigChange({ captureStepId: captureStepId ?? '' })
        }
        steps={steps}
        error={getFieldError(errors, 'photo.captureStepId')}
      />
      <AspectRatioSelector
        value={config.aspectRatio}
        onChange={(aspectRatio) =>
          onConfigChange({ aspectRatio: aspectRatio as AspectRatio })
        }
      />
    </div>
  )
}
