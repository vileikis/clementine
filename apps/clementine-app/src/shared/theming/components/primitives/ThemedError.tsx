/**
 * ThemedError Component
 *
 * Error state primitive that applies theme styles to heading, message,
 * and retry button. Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedError
 *   message="Failed to start processing. Please try again."
 *   onRetry={() => retryCompletion()}
 * />
 *
 * // Without provider - pass theme directly
 * <ThemedError message="Something failed" theme={previewTheme} />
 *
 * // With custom title and retry label
 * <ThemedError
 *   title="Connection lost"
 *   message="Could not reach the server."
 *   retryLabel="Reconnect"
 *   onRetry={handleReconnect}
 * />
 * ```
 */

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { ThemedText } from './ThemedText'
import { ThemedButton } from './ThemedButton'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedErrorProps {
  /**
   * Error heading (defaults to "Something went wrong")
   */
  title?: string

  /**
   * Error message displayed below the heading
   */
  message: string

  /**
   * Retry button label (defaults to "Try Again")
   */
  retryLabel?: string

  /**
   * Retry callback — if not provided, no button is shown
   */
  onRetry?: () => void

  /**
   * Theme override for use without ThemeProvider
   */
  theme?: Theme

  /**
   * Additional CSS classes for root container
   */
  className?: string
}

/**
 * ThemedError - Themed error state with heading, message, and optional retry
 *
 * Layout: centered flex column with gap, fills parent via flex-1.
 * Mirrors ThemedLoading layout for visual consistency during state transitions.
 */
export function ThemedError({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try Again',
  onRetry,
  theme: themeOverride,
  className,
}: ThemedErrorProps) {
  useThemeWithOverride(themeOverride)

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center',
        className,
      )}
    >
      <ThemedText variant="heading" as="h2">
        {title}
      </ThemedText>
      <ThemedText variant="body">{message}</ThemedText>
      {onRetry && <ThemedButton onClick={onRetry}>{retryLabel}</ThemedButton>}
    </div>
  )
}
