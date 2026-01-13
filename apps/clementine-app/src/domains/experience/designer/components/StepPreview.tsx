/**
 * StepPreview Component
 *
 * Center column showing a preview of the selected step.
 * Wraps PreviewShell for viewport switching and device frame.
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
import type { Step } from '../../steps/registry/step-registry'
import { PreviewShell } from '@/shared/preview-shell'

interface StepPreviewProps {
  /** The currently selected step, or null if no step selected */
  step: Step | null
}

/**
 * Step preview with device frame
 *
 * Shows a visual preview of the selected step in a device frame.
 * Supports viewport switching between mobile and desktop.
 *
 * @example
 * ```tsx
 * <StepPreview step={selectedStep} />
 * ```
 */
export function StepPreview({ step }: StepPreviewProps) {
  return (
    <div className="flex h-full flex-col bg-muted/30">
      <PreviewShell enableViewportSwitcher enableFullscreen>
        {step ? <StepRendererRouter step={step} /> : <NoStepSelected />}
      </PreviewShell>
    </div>
  )
}

/**
 * Placeholder when no step is selected
 */
function NoStepSelected() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">
        Select a step to preview
      </p>
    </div>
  )
}

/**
 * Routes to the correct renderer based on step type
 */
function StepRendererRouter({ step }: { step: Step }) {
  const props = { mode: 'edit' as const, step }

  switch (step.type) {
    case 'info':
      return <InfoStepRenderer {...props} />
    case 'input.scale':
      return <InputScaleRenderer {...props} />
    case 'input.yesNo':
      return <InputYesNoRenderer {...props} />
    case 'input.multiSelect':
      return <InputMultiSelectRenderer {...props} />
    case 'input.shortText':
      return <InputShortTextRenderer {...props} />
    case 'input.longText':
      return <InputLongTextRenderer {...props} />
    case 'capture.photo':
      return <CapturePhotoRenderer {...props} />
    case 'transform.pipeline':
      return <TransformPipelineRenderer {...props} />
    default:
      // Type-safe exhaustive check - this should never happen
      return (
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Unknown step type: {(step as Step).type}
          </p>
        </div>
      )
  }
}
