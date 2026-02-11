/**
 * RuntimeNavigation Component
 *
 * Bottom navigation bar for experience runtime with next button.
 * Reads next and canProceed from the runtime store via useRuntime().
 *
 * @example
 * ```tsx
 * <RuntimeNavigation />
 * <RuntimeNavigation buttonLabel="Submit" />
 * ```
 */

import { useRuntime } from '../hooks/useRuntime'
import { ThemedButton } from '@/shared/theming'

export interface RuntimeNavigationProps {
  /** Custom button label (defaults to "Next") */
  buttonLabel?: string
}

/**
 * RuntimeNavigation - Bottom navigation for experience runtime
 *
 * Renders next/submit button with responsive layout:
 * - Mobile: Fixed at bottom with gradient background
 * - Desktop: Centered in flow with margin top
 */
export function RuntimeNavigation({
  buttonLabel = 'Next',
}: RuntimeNavigationProps) {
  const { next, canProceed } = useRuntime()

  const isNextDisabled = !canProceed

  return (
    <>
      {/* Mobile: Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/20 to-transparent md:hidden z-40">
        <div className="flex justify-center mx-auto">
          <ThemedButton
            onClick={next}
            disabled={isNextDisabled}
            size="md"
            className="min-w-32"
          >
            {buttonLabel}
          </ThemedButton>
        </div>
      </div>

      {/* Desktop: Button in flow */}
      <div className="hidden md:flex justify-center py-8 shrink-0">
        <ThemedButton
          onClick={next}
          disabled={isNextDisabled}
          size="md"
          className="min-w-32"
        >
          {buttonLabel}
        </ThemedButton>
      </div>
    </>
  )
}
