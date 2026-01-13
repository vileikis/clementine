/**
 * Capture Photo Renderer
 *
 * Edit-mode renderer for photo capture steps.
 * Shows camera placeholder, instructions, and countdown.
 */
import { Camera } from 'lucide-react'
import type { StepRendererProps } from '../registry/step-registry'
import type { CapturePhotoStepConfig } from '../schemas/capture-photo.schema'

export function CapturePhotoRenderer({ config }: StepRendererProps) {
  const { instructions, countdown } = config as CapturePhotoStepConfig

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Camera placeholder */}
      <div className="flex h-48 w-48 flex-col items-center justify-center rounded-lg bg-muted">
        <Camera className="h-12 w-12 text-muted-foreground" />
        <span className="mt-2 text-sm text-muted-foreground">Camera</span>
      </div>

      {/* Countdown indicator */}
      {countdown > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Countdown: {countdown}s</span>
        </div>
      )}

      {/* Instructions */}
      {instructions && (
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {instructions}
        </p>
      )}
    </div>
  )
}
