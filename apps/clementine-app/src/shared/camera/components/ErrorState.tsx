/**
 * ErrorState Component
 *
 * Displays error messages with helpful hints and fallback actions.
 * Provides library fallback when camera access fails.
 */

import { AlertCircle, ImageIcon, RefreshCw } from 'lucide-react'
import { DEFAULT_LABELS } from '../constants'
import type { CameraCaptureError, CameraCaptureLabels } from '../types'
import { Button } from '@/ui-kit/components/button'
import { cn } from '@/shared/utils'

interface ErrorStateProps {
  /** The error to display */
  error: CameraCaptureError
  /** Custom labels for i18n */
  labels?: CameraCaptureLabels
  /** Whether to show retry option */
  showRetry?: boolean
  /** Whether to show library fallback */
  showLibraryFallback?: boolean
  /** Called when user taps retry */
  onRetry?: () => void
  /** Called when user taps use library */
  onOpenLibrary?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Get user-friendly error title based on error code
 */
function getErrorTitle(
  code: CameraCaptureError['code'],
  labels: Required<CameraCaptureLabels>,
): string {
  switch (code) {
    case 'PERMISSION_DENIED':
      return labels.permissionDenied
    case 'PERMISSION_DISMISSED':
      return labels.permissionDismissed
    case 'CAMERA_UNAVAILABLE':
      return labels.cameraUnavailable
    case 'CAMERA_IN_USE':
      return labels.cameraInUse
    case 'CAPTURE_FAILED':
      return labels.captureError
    case 'INVALID_FILE_TYPE':
      return labels.invalidFileType
    case 'UNKNOWN':
      return labels.unknownError
  }
}

/**
 * Get helpful hint based on error code
 */
function getErrorHint(
  code: CameraCaptureError['code'],
  labels: Required<CameraCaptureLabels>,
): string | null {
  switch (code) {
    case 'PERMISSION_DENIED':
      return labels.permissionDeniedHint
    case 'CAMERA_IN_USE':
      return labels.cameraInUseHint
    case 'CAMERA_UNAVAILABLE':
      return labels.cameraUnavailableHint
    default:
      return null
  }
}

/**
 * ErrorState - Error display with recovery options
 */
export function ErrorState({
  error,
  labels = {},
  showRetry = true,
  showLibraryFallback = true,
  onRetry,
  onOpenLibrary,
  className,
}: ErrorStateProps) {
  const mergedLabels = {
    ...DEFAULT_LABELS,
    ...labels,
  } as Required<CameraCaptureLabels>

  const title = getErrorTitle(error.code, mergedLabels)
  const hint = getErrorHint(error.code, mergedLabels)

  // Determine which actions to show based on error type
  const canRetry = showRetry && error.code !== 'CAMERA_UNAVAILABLE'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full p-6 text-center',
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div className="mb-6 p-4 rounded-full bg-destructive/10">
        <AlertCircle className="size-12 text-destructive" aria-hidden="true" />
      </div>

      {/* Error title */}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>

      {/* Hint text */}
      {hint && <p className="text-muted-foreground mb-6 max-w-xs">{hint}</p>}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {canRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full min-h-[44px]"
          >
            <RefreshCw className="size-4 mr-2" />
            {mergedLabels.retry}
          </Button>
        )}

        {showLibraryFallback && onOpenLibrary && (
          <Button onClick={onOpenLibrary} className="w-full min-h-[44px]">
            <ImageIcon className="size-4 mr-2" />
            {mergedLabels.openLibrary}
          </Button>
        )}
      </div>
    </div>
  )
}
