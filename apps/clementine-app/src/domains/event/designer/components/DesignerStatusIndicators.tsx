import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'

/**
 * Status indicators for the event designer.
 *
 * Displays:
 * - Spinner (Loader2) when saves are in progress (pendingSaves > 0)
 * - Checkmark (Check) for 3 seconds after all saves complete
 * - Nothing when idle (no ongoing or recently completed saves)
 *
 * Accessibility:
 * - role="status" indicates status update region
 * - aria-live="polite" announces changes without interruption
 * - sr-only labels provide context for screen readers
 */
export function DesignerStatusIndicators() {
  const { pendingSaves, lastCompletedAt } = useEventDesignerStore()
  const [showSuccess, setShowSuccess] = useState(false)

  const isSaving = pendingSaves > 0

  // Handle success checkmark timer (3 seconds after all saves complete)
  useEffect(() => {
    if (lastCompletedAt === null) {
      setShowSuccess(false)
      return
    }

    const elapsed = Date.now() - lastCompletedAt

    if (elapsed < 3000) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 3000 - elapsed)
      return () => clearTimeout(timer) // Cleanup
    } else {
      setShowSuccess(false)
    }
  }, [lastCompletedAt])

  // Hide indicator when idle (no saves pending or recently completed)
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
