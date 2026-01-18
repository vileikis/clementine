/**
 * Capture Photo Renderer
 *
 * Main orchestrator for photo capture steps.
 * Delegates to edit mode (placeholder) or run mode (full camera integration).
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display of camera placeholder
 * - Run mode: Full camera integration with capture, review, and upload
 */

import { CapturePhotoEditMode } from './CapturePhotoEditMode'
import { CapturePhotoRunMode } from './CapturePhotoRunMode'
import type { StepRendererProps } from '../../registry/step-registry'
import type { CapturePhotoStepConfig } from '../../schemas/capture-photo.schema'

export function CapturePhotoRenderer({
  step,
  mode,
  onSubmit,
  onBack,
  canGoBack,
}: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config
  const isSquare = aspectRatio === '1:1'

  if (mode === 'edit') {
    return <CapturePhotoEditMode aspectRatio={aspectRatio} />
  }

  return (
    <CapturePhotoRunMode
      step={step}
      aspectRatio={aspectRatio}
      isSquare={isSquare}
      onSubmit={onSubmit}
      onBack={onBack}
      canGoBack={canGoBack}
    />
  )
}
