/**
 * PhotoConfigForm Component
 *
 * Configuration form for Photo outcome type.
 * Renders SourceImageSelector (captureStepId) and AspectRatioSelector.
 *
 * @see specs/072-outcome-schema-redesign — US1
 */
import { getFieldError } from '../../hooks/useExperienceConfigValidation'
import { SourceImageSelector } from '../shared-controls/SourceImageSelector'
import { AspectRatioSelector } from '../shared-controls/AspectRatioSelector'
import type { FieldValidationError } from '../../hooks/useExperienceConfigValidation'
import type { ExperienceStep, PhotoConfig } from '@clementine/shared'

export interface PhotoConfigFormProps {
  /** Photo configuration */
  config: PhotoConfig
  /** Callback when config changes */
  onConfigChange: (updates: Partial<PhotoConfig>) => void
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
        onChange={(aspectRatio) => onConfigChange({ aspectRatio: aspectRatio })}
      />
    </div>
  )
}
