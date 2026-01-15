/**
 * StepRendererRouter Component
 *
 * Routes step rendering to the appropriate renderer based on step type.
 * Supports both edit and run modes with all necessary props.
 */
import {
  CapturePhotoRenderer,
  InfoStepRenderer,
  InputLongTextRenderer,
  InputMultiSelectRenderer,
  InputScaleRenderer,
  InputShortTextRenderer,
  InputYesNoRenderer,
  TransformPipelineRenderer,
} from '../../steps/renderers'
import type { StepRendererProps } from '../../steps/registry/step-registry'
import type { ExperienceStep } from '../../shared/schemas/experience.schema'

/**
 * Props for StepRendererRouter
 */
export interface StepRendererRouterProps extends Omit<
  StepRendererProps,
  'step'
> {
  /** The step to render */
  step: ExperienceStep
}

/**
 * Routes to the correct renderer based on step type
 *
 * Supports all step types:
 * - info: Information/display step
 * - input.scale: Opinion scale (1-10)
 * - input.yesNo: Yes/No question
 * - input.multiSelect: Multiple choice
 * - input.shortText: Short text input
 * - input.longText: Long text input
 * - capture.photo: Photo capture (placeholder)
 * - transform.pipeline: AI transform (placeholder)
 */
export function StepRendererRouter({
  step,
  ...props
}: StepRendererRouterProps) {
  // Cast to Step type for renderers (ExperienceStep is compatible)
  const stepProps = { step, ...props } as StepRendererProps

  switch (step.type) {
    case 'info':
      return <InfoStepRenderer {...stepProps} />
    case 'input.scale':
      return <InputScaleRenderer {...stepProps} />
    case 'input.yesNo':
      return <InputYesNoRenderer {...stepProps} />
    case 'input.multiSelect':
      return <InputMultiSelectRenderer {...stepProps} />
    case 'input.shortText':
      return <InputShortTextRenderer {...stepProps} />
    case 'input.longText':
      return <InputLongTextRenderer {...stepProps} />
    case 'capture.photo':
      return <CapturePhotoRenderer {...stepProps} />
    case 'transform.pipeline':
      return <TransformPipelineRenderer {...stepProps} />
    default:
      // Unknown step type
      return (
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Unknown step type: {step.type}
          </p>
        </div>
      )
  }
}
