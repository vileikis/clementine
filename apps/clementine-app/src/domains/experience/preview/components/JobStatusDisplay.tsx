/**
 * JobStatusDisplay Component
 *
 * Displays transform job status with appropriate icons and messages.
 * Used in ExperiencePreviewModal after completion to show transform progress.
 *
 * States:
 * - pending/running: Spinner with status message
 * - completed: Result media image + success message
 * - completed (no media yet): Success icon while media URL resolves
 * - failed/cancelled: Error icon with error message
 */
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import type { JobStatus } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'

interface JobStatusDisplayProps {
  /** Current job status from session.jobStatus */
  jobStatus: JobStatus | null
  /** Result media URL (available when job completes) */
  resultMediaUrl?: string | null
  /** Optional callback when user clicks close/done button */
  onClose?: () => void
}

const STATUS_MESSAGES: Record<JobStatus, string> = {
  pending: 'Preparing your transformation...',
  running: 'Creating your AI masterpiece...',
  completed: 'Your creation is ready!',
  failed: 'Something went wrong. Please try again.',
  cancelled: 'Transformation was cancelled.',
}

/**
 * Displays job status with icons, messages, and result media
 *
 * @example
 * ```tsx
 * <JobStatusDisplay
 *   jobStatus={session.jobStatus}
 *   resultMediaUrl={session.resultMedia?.url}
 *   onClose={handleClose}
 * />
 * ```
 */
export function JobStatusDisplay({
  jobStatus,
  resultMediaUrl,
  onClose,
}: JobStatusDisplayProps) {
  const isInProgress = jobStatus === 'pending' || jobStatus === 'running'
  const isCompleted = jobStatus === 'completed'
  const isFailed = jobStatus === 'failed' || jobStatus === 'cancelled'

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        {isInProgress && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">
              {STATUS_MESSAGES[jobStatus ?? 'pending']}
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes less than a minute
            </p>
          </>
        )}

        {isCompleted && (
          <>
            {resultMediaUrl ? (
              <img
                src={resultMediaUrl}
                alt="Transform result"
                className="max-h-80 w-auto rounded-lg object-contain shadow-md"
              />
            ) : (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            <p className="text-lg font-medium">{STATUS_MESSAGES.completed}</p>
            {onClose && <Button onClick={onClose}>Close Preview</Button>}
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">
              {STATUS_MESSAGES[jobStatus ?? 'failed']}
            </p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
