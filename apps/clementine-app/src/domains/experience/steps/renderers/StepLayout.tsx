/**
 * StepLayout Component
 *
 * Shared layout wrapper for all step renderers. Provides:
 * - ThemedBackground for consistent styling
 * - Responsive layout with centered content
 * - Fixed bottom "Next" button on mobile
 * - Flexible content on desktop with button in flow
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
 * // With submit handler (guest mode - button functional)
 * <StepLayout onSubmit={handleNext}>
 *   <StepContent />
 * </StepLayout>
 * ```
 */

import type { ReactNode } from 'react'
import { ThemedBackground, ThemedButton } from '@/shared/theming'
import { cn } from '@/shared/utils'

export interface StepLayoutProps {
  /** Step content to render */
  children: ReactNode
  /** Submit handler - if provided, button is enabled */
  onSubmit?: () => void
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
  buttonLabel = 'Next',
  hideButton = false,
  contentClassName,
}: StepLayoutProps) {
  const isDisabled = !onSubmit

  return (
    <ThemedBackground
      className="h-full w-full"
      contentClassName={cn(
        // Full height flex container
        'flex flex-col min-h-full',
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

      {/* Submit button */}
      {!hideButton && (
        <>
          {/* Mobile: Fixed bottom button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent md:hidden">
            <ThemedButton
              onClick={onSubmit}
              disabled={isDisabled}
              size="lg"
              className="w-full"
            >
              {buttonLabel}
            </ThemedButton>
          </div>

          {/* Desktop: Button in flow */}
          <div className="hidden md:flex justify-center mt-8">
            <ThemedButton
              onClick={onSubmit}
              disabled={isDisabled}
              size="lg"
              className="min-w-48"
            >
              {buttonLabel}
            </ThemedButton>
          </div>
        </>
      )}
    </ThemedBackground>
  )
}
