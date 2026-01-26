/**
 * StepLayout Component
 *
 * Shared layout wrapper for all step renderers. Provides:
 * - Responsive layout with centered content
 * - Fixed bottom navigation on mobile (Back + Next/Continue)
 * - Flexible content on desktop with buttons in flow
 *
 * Note: Does NOT include ThemedBackground - parent page/modal owns the background.
 * This allows the background to persist across state changes for better performance.
 *
 * Must be used within a ThemeProvider.
 *
 * @example
 * ```tsx
 * // Basic usage (edit mode - button shown but disabled)
 * <StepLayout>
 *   <StepContent />
 * </StepLayout>
 *
 * // Run mode with full navigation
 * <StepLayout
 *   onSubmit={handleNext}
 *   onBack={handleBack}
 *   canGoBack={true}
 *   canProceed={isValid}
 * >
 *   <StepContent />
 * </StepLayout>
 * ```
 */

import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemedButton } from '@/shared/theming'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

export interface StepLayoutProps {
  /** Step content to render */
  children: ReactNode
  /** Submit handler - if provided and canProceed, button is enabled */
  onSubmit?: () => void
  /** Back handler (run mode only) */
  onBack?: () => void
  /** Whether back navigation is available (run mode only) */
  canGoBack?: boolean
  /** Whether proceeding is allowed (run mode - defaults to true if onSubmit provided) */
  canProceed?: boolean
  /** Custom button label (defaults to "Next") */
  buttonLabel?: string
  /** Hide the submit button entirely */
  hideButton?: boolean
  /** Additional class for the content container */
  contentClassName?: string
}

export function StepLayout({
  children,
  onSubmit,
  onBack,
  canGoBack = false,
  canProceed = true,
  buttonLabel = 'Next',
  hideButton = false,
  contentClassName,
}: StepLayoutProps) {
  // Submit is disabled if no handler or canProceed is false
  const isSubmitDisabled = !onSubmit || !canProceed
  const showBackButton = canGoBack && onBack

  return (
    <div
      className={cn(
        // Full height flex container
        'flex h-full w-full flex-col',
        // Mobile: pb for fixed button space
        // Desktop: no extra padding needed
        !hideButton && 'pb-20 md:pb-0',
      )}
    >
      {/* Content area - grows to fill space, centers content vertically */}
      <div
        className={cn(
          'flex flex-1 flex-col items-center',
          // Desktop: center content vertically
          'md:justify-center',
          // Mobile: content at top with some padding
          'justify-start pt-4 md:pt-0',
          contentClassName,
        )}
      >
        {children}
      </div>

      {/* Navigation buttons */}
      {!hideButton && (
        <>
          {/* Mobile: Fixed bottom buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/20 to-transparent md:hidden">
            <div className="flex gap-3">
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
                onClick={onSubmit}
                disabled={isSubmitDisabled}
                size="lg"
                className="flex-1"
              >
                {buttonLabel}
              </ThemedButton>
            </div>
          </div>

          {/* Desktop: Buttons in flow */}
          <div className="hidden md:flex justify-center gap-4 mt-8">
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
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              size="lg"
              className="min-w-48"
            >
              {buttonLabel}
            </ThemedButton>
          </div>
        </>
      )}
    </div>
  )
}
