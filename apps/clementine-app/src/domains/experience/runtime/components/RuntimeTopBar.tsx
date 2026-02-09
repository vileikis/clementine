/**
 * RuntimeTopBar Component
 *
 * Top navigation bar displayed during experience execution.
 * Shows experience name, progress tracking, and home navigation button with confirmation.
 *
 * @example
 * ```tsx
 * // Guest mode - home button active with confirmation
 * <RuntimeTopBar
 *   experienceName="Summer Festival 2024"
 *   currentStepIndex={2}
 *   totalSteps={5}
 *   onHomeClick={() => navigate('/home')}
 * />
 *
 * // Preview mode - home button disabled
 * <RuntimeTopBar
 *   experienceName="Preview Experience"
 *   currentStepIndex={0}
 *   totalSteps={3}
 *   onHomeClick={undefined}
 * />
 * ```
 */

import { useState } from 'react'
import { ArrowLeft, Home, X } from 'lucide-react'
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
   * Experience name to display in center
   * Should be human-readable experience title
   * Will truncate if too long (CSS: max-w-[200px] truncate)
   */
  experienceName: string

  /**
   * Current step index (0-based)
   * Used for progress calculation
   */
  currentStepIndex: number

  /**
   * Total number of steps in experience
   * Used for progress calculation
   * Must be >= 1 (experiences with 0 steps should not render topbar)
   */
  totalSteps: number

  /**
   * Home navigation handler (called after confirmation)
   * - Guest mode: Function to navigate home
   * - Preview mode: undefined (button disabled/inactive)
   */
  onHomeClick?: () => void

  /** Handler for back navigation */
  onBack?: () => void

  /** Handler for closing the experience (first step or single-step) */
  onClose?: () => void

  /** Whether back navigation is available */
  canGoBack?: boolean

  /**
   * Additional CSS classes for topbar container
   */
  className?: string
}

/**
 * RuntimeTopBar - Experience execution topbar
 *
 * Displays experience name, progress bar showing step completion,
 * and home button for navigation with confirmation dialog.
 *
 * Progress calculation: ((currentStepIndex + 1) / totalSteps) * 100
 * - Add 1 to index because it's 0-based (step 0 = first step = 1/5 = 20%)
 *
 * Layout:
 * - Relative positioning (respects parent container width)
 * - Home button (left), experience name (center), progress bar (bottom)
 * - Touch target minimum 44px for mobile accessibility
 * - Confirmation dialog managed internally
 */
export function RuntimeTopBar({
  experienceName,
  currentStepIndex,
  totalSteps,
  onHomeClick,
  onBack,
  onClose,
  className,
}: RuntimeTopBarProps) {
  const [showDialog, setShowDialog] = useState(false)

  const isCloseMode = totalSteps === 1 || currentStepIndex === 0

  // Calculate progress percentage
  // Add 1 to currentStepIndex because it's 0-based (step 0 = first step)
  const progress =
    totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  const handleGoBack = () => {
    if (isCloseMode) {
      handleHomeButtonClick()
      onClose?.()
    } else {
      onBack?.()
    }
  }

  const handleHomeButtonClick = () => {
    if (onHomeClick) {
      setShowDialog(true)
    }
  }

  const handleConfirmExit = () => {
    setShowDialog(false)
    onHomeClick?.()
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
              {experienceName || 'Experience'}
            </ThemedText>

            {totalSteps > 1 && (
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
            disabled={!onHomeClick}
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
