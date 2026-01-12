/**
 * EditorSaveStatus Component
 *
 * Status indicator for save operations in an editor.
 * Shows spinner while saving, checkmark after completion.
 */
import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface EditorSaveStatusProps {
  /** Number of pending save operations */
  pendingSaves: number
  /** Timestamp when all saves completed */
  lastCompletedAt: number | null
  /** How long to show success indicator (ms, defaults to 3000) */
  successDuration?: number
}

/**
 * Save status indicator component
 *
 * Displays:
 * - Spinner when saves are in progress (pendingSaves > 0)
 * - Checkmark for specified duration after all saves complete
 * - Nothing when idle
 *
 * Accessibility:
 * - role="status" indicates status update region
 * - aria-live="polite" announces changes without interruption
 * - sr-only labels provide context for screen readers
 *
 * @example
 * ```tsx
 * const { pendingSaves, lastCompletedAt } = useEventDesignerStore()
 *
 * <EditorSaveStatus
 *   pendingSaves={pendingSaves}
 *   lastCompletedAt={lastCompletedAt}
 * />
 * ```
 */
export function EditorSaveStatus({
  pendingSaves,
  lastCompletedAt,
  successDuration = 3000,
}: EditorSaveStatusProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  const isSaving = pendingSaves > 0

  // Handle success checkmark timer
  useEffect(() => {
    if (lastCompletedAt === null) {
      setShowSuccess(false)
      return
    }

    const elapsed = Date.now() - lastCompletedAt

    if (elapsed < successDuration) {
      setShowSuccess(true)
      const timer = setTimeout(
        () => setShowSuccess(false),
        successDuration - elapsed,
      )
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [lastCompletedAt, successDuration])

  // Hide when idle
  if (!isSaving && !showSuccess) {
    return null
  }

  return (
    <div role="status" aria-live="polite" className="flex items-center">
      {isSaving && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="sr-only">Saving changes...</span>
        </>
      )}
      {!isSaving && showSuccess && (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          <span className="sr-only">Changes saved successfully</span>
        </>
      )}
    </div>
  )
}
