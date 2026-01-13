/**
 * Capture Photo Renderer
 *
 * Edit-mode renderer for photo capture steps.
 * Shows camera placeholder with aspect ratio indicator.
 */
import { Camera } from 'lucide-react'
import type { StepRendererProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'

export function CapturePhotoRenderer({ step }: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const { aspectRatio } = config

  // Calculate dimensions based on aspect ratio
  const isSquare = aspectRatio === '1:1'

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Camera placeholder with aspect ratio */}
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-muted ${
          isSquare ? 'h-48 w-48' : 'h-64 w-36'
        }`}
      >
        <Camera className="h-12 w-12 text-muted-foreground" />
        <span className="mt-2 text-sm text-muted-foreground">Camera</span>
      </div>

      {/* Aspect ratio indicator */}
      <div className="text-xs text-muted-foreground">
        Aspect ratio: {aspectRatio}
      </div>
    </div>
  )
}
