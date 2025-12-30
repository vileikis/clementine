/**
 * PhotoReview Component
 *
 * Displays captured photo with confirm and retake actions.
 */

import { DEFAULT_LABELS } from '../constants'
import type { CameraCaptureLabels, CapturedPhoto } from '../types'
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/shared/utils'

interface PhotoReviewProps {
  /** The captured photo to review */
  photo: CapturedPhoto
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels
  /** Whether submission is in progress */
  isSubmitting?: boolean
  /** Called when user confirms photo */
  onConfirm: () => void
  /** Called when user wants to retake */
  onRetake?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Photo review screen with confirm/retake actions
 */
export function PhotoReview({
  photo,
  labels = {},
  isSubmitting = false,
  onConfirm,
  onRetake,
  className,
}: PhotoReviewProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels }

  return (
    <div className={cn('flex flex-col h-full bg-black', className)}>
      {/* Photo preview */}
      <div className="flex-1 relative">
        <img
          src={photo.previewUrl}
          alt="Captured photo preview"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 p-4 bg-black/50">
        {onRetake && (
          <Button
            variant="outline"
            onClick={onRetake}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] bg-transparent text-white border-white hover:bg-white/10 hover:text-white"
          >
            {mergedLabels.retake}
          </Button>
        )}

        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 min-h-[44px] bg-white text-black hover:bg-white/90"
        >
          {isSubmitting ? 'Processing...' : mergedLabels.confirm}
        </Button>
      </div>
    </div>
  )
}
