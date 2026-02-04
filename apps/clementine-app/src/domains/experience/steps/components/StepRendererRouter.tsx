/**
 * StepRendererRouter Component
 *
 * Routes step rendering to the appropriate renderer based on step type.
 * Supports both edit and run modes with all necessary props.
 *
 * @example
 * ```tsx
 * // Edit mode (designer preview)
 * <StepRendererRouter step={selectedStep} mode="edit" />
 *
 * // Run mode (runtime execution)
 * <StepRendererRouter
 *   step={currentStep}
 *   mode="run"
 *   response={getResponse(currentStep.id)}
 *   onResponseChange={handleResponseChange}
 *   onSubmit={next}
 *   onBack={back}
 *   canGoBack={canGoBack}
 *   canProceed={canProceed}
 * />
 * ```
 */
import {
  CapturePhotoRenderer,
  InfoStepRenderer,
  InputLongTextRenderer,
  InputMultiSelectRenderer,
  InputScaleRenderer,
  InputShortTextRenderer,
  InputYesNoRenderer,
} from '../renderers'
import type { Step, StepRendererProps } from '../registry/step-registry'

/**
 * Generic step type that accepts both Step (from registry) and ExperienceStep (from Firestore)
 * This allows the router to work with steps from either source.
 */
type GenericStep = {
  id: string
  type: string
  config: Record<string, unknown>
}

/**
 * Props for StepRendererRouter
 */
export interface StepRendererRouterProps extends Omit<
  StepRendererProps,
  'step'
> {
  /** The step to render - accepts both Step and ExperienceStep types */
  step: Step | GenericStep
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
 * - capture.photo: Photo capture
 */
export function StepRendererRouter({
  step,
  ...props
}: StepRendererRouterProps) {
  // Cast to Step for renderer props - the switch ensures type safety
  const stepProps: StepRendererProps = { step: step as Step, ...props }

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
    default:
      // Unknown step type fallback
      return (
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Unknown step type: {(step as Step).type}
          </p>
        </div>
      )
  }
}
