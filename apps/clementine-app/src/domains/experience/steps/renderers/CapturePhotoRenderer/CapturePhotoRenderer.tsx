/**
 * Capture Photo Renderer
 *
 * Main orchestrator for photo capture steps.
 * Delegates to edit mode (placeholder) or run mode (full camera integration).
 *
 * Supports both edit and run modes:
 * - Edit mode: Preview-only display of camera placeholder
 * - Run mode: Full camera integration with capture, review, and upload
 *
 * Note: This step manages its own navigation (capture/retake/confirm flow).
 * The ExperienceRuntime hides its standard navigation for this step type.
 */

import { CapturePhotoEditMode } from './CapturePhotoEditMode'
import { CapturePhotoRunMode } from './CapturePhotoRunMode'
import type { StepRendererProps } from '../../registry/step-registry'
import type { ExperienceCapturePhotoStepConfig } from '@clementine/shared'

export function CapturePhotoRenderer({ step, mode }: StepRendererProps) {
  const config = step.config as ExperienceCapturePhotoStepConfig
  const { aspectRatio } = config

  if (mode === 'edit') {
    return <CapturePhotoEditMode aspectRatio={aspectRatio} />
  }

  return <CapturePhotoRunMode step={step} aspectRatio={aspectRatio} />
}
