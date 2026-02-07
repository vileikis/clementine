/**
 * RuntimeNavigation Component
 *
 * Bottom navigation bar for experience runtime with back/next buttons.
 * Handles responsive layout: fixed bottom on mobile, in-flow on desktop.
 *
 * @example
 * ```tsx
 * <RuntimeNavigation
 *   onNext={handleNext}
 *   onBack={handleBack}
 *   canGoBack={currentStepIndex > 0}
 *   canProceed={isResponseValid}
 * />
 * ```
 */

import { ChevronLeft } from 'lucide-react'
import { ThemedButton } from '@/shared/theming'
import { Button } from '@/ui-kit/ui/button'

export interface RuntimeNavigationProps {
  /** Handler for next/submit action */
  onNext?: () => void
  /** Handler for back navigation */
  onBack?: () => void
  /** Whether back navigation is available */
  canGoBack?: boolean
  /** Whether proceeding is allowed */
  canProceed?: boolean
  /** Custom button label (defaults to "Next") */
  buttonLabel?: string
}

/**
 * RuntimeNavigation - Bottom navigation for experience runtime
 *
 * Renders back and next/submit buttons with responsive layout:
 * - Mobile: Fixed at bottom with gradient background
 * - Desktop: Centered in flow with margin top
 */
export function RuntimeNavigation({
  onNext,
  onBack,
  canGoBack = false,
  canProceed = true,
  buttonLabel = 'Next',
}: RuntimeNavigationProps) {
  const isNextDisabled = !onNext || !canProceed
  const showBackButton = canGoBack && onBack

  return (
    <>
      {/* Mobile: Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/20 to-transparent md:hidden z-40">
        <div className="flex gap-3 max-w-md mx-auto">
          {showBackButton && (
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <ThemedButton
            onClick={onNext}
            disabled={isNextDisabled}
            size="lg"
            className="flex-1"
          >
            {buttonLabel}
          </ThemedButton>
        </div>
      </div>

      {/* Desktop: Buttons in flow */}
      <div className="hidden md:flex justify-center gap-4 py-8 shrink-0">
        {showBackButton && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="min-w-24"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
        )}
        <ThemedButton
          onClick={onNext}
          disabled={isNextDisabled}
          size="lg"
          className="min-w-48"
        >
          {buttonLabel}
        </ThemedButton>
      </div>
    </>
  )
}
