/**
 * RuntimeTopBar Component
 *
 * Top navigation bar displayed during experience execution.
 * Reads all runtime state from the store via useRuntime().
 * Only accepts onClose callback and className as props.
 *
 * @example
 * ```tsx
 * // Guest mode - close button active with confirmation
 * <RuntimeTopBar onClose={() => navigate('/home')} />
 *
 * // Preview mode - close button disabled
 * <RuntimeTopBar onClose={undefined} />
 * ```
 */

import { useState } from 'react'
import { ArrowLeft, Home, X } from 'lucide-react'

import { useRuntime } from '../hooks/useRuntime'
import {
  ThemedIconButton,
  ThemedProgressBar,
  ThemedText,
} from '@/shared/theming'
import { cn } from '@/shared/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/ui/alert-dialog'

export interface RuntimeTopBarProps {
  /**
   * Exit handler (called after confirmation dialog)
   * - Guest mode: Function to navigate home
   * - Preview mode: undefined (button disabled/inactive)
   */
  onClose?: () => void

  /**
   * Additional CSS classes for topbar container
   */
  className?: string
}

/**
 * RuntimeTopBar - Experience execution topbar
 *
 * Displays experience name, progress bar showing step completion,
 * and back/close button with confirmation dialog.
 *
 * Reads all state from the runtime store via useRuntime():
 * - experienceName, currentStepIndex, totalSteps, isComplete, canGoBack, back
 *
 * Progress calculation: ((currentStepIndex + 1) / totalSteps) * 100
 */
export function RuntimeTopBar({ onClose, className }: RuntimeTopBarProps) {
  const {
    experienceName,
    currentStepIndex,
    totalSteps,
    isComplete,
    canGoBack,
    back,
  } = useRuntime()

  const [showDialog, setShowDialog] = useState(false)

  const isCloseMode = isComplete || totalSteps === 1 || currentStepIndex === 0

  // Calculate progress percentage
  const progress =
    totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  const handleGoBack = () => {
    if (isCloseMode) {
      if (onClose) {
        setShowDialog(true)
      }
    } else if (canGoBack) {
      back()
    }
  }

  const handleHomeButtonClick = () => {
    if (onClose) {
      setShowDialog(true)
    }
  }

  const handleConfirmExit = () => {
    setShowDialog(false)
    onClose?.()
  }

  return (
    <>
      <div
        className={cn(
          // Fixed positioning
          'fixed top-0 left-0 right-0 z-50',
          'flex justify-center',
          'px-4 pt-3 pb-8',
          className,
        )}
      >
        {/* Blurred background with gradient fade */}
        <div
          className="absolute inset-0 backdrop-blur-md bg-black/10"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        />

        {/* Inner container with max width */}
        <div className="relative w-full max-w-2xl flex items-center gap-4">
          {/* Left: Back/Close button */}
          <ThemedIconButton
            size="md"
            variant="outline"
            onClick={handleGoBack}
            aria-label={isCloseMode ? 'Close' : 'Go back'}
            className="shrink-0"
          >
            {isCloseMode ? (
              <X className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </ThemedIconButton>

          {/* Center: Title and progress bar */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <ThemedText
              variant="heading"
              as="h3"
              className="max-w-[200px] truncate text-xl"
            >
              {experienceName}
            </ThemedText>

            {totalSteps > 1 && !isComplete && (
              <ThemedProgressBar
                className="w-full max-w-[200px]"
                value={progress}
                getValueLabel={(value) =>
                  `Step ${currentStepIndex + 1} of ${totalSteps} (${Math.round(value)}% complete)`
                }
              />
            )}
          </div>

          {/* Right: Home button */}
          <ThemedIconButton
            size="md"
            variant="outline"
            onClick={handleHomeButtonClick}
            disabled={!onClose}
            aria-label="Return to home"
            className="shrink-0"
          >
            <Home className="h-5 w-5" />
          </ThemedIconButton>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost if you leave now. Are you sure you want
              to return home?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
