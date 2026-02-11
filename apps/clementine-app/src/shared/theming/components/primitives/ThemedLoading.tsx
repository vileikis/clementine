/**
 * ThemedLoading Component
 *
 * Loading spinner + message primitive that applies theme primary color
 * to the spinner and theme text styles to the message.
 * Supports context-based theming or direct theme prop override.
 *
 * @example
 * ```tsx
 * // Within ThemeProvider - uses context
 * <ThemedLoading message="Completing your experience..." />
 *
 * // Without provider - pass theme directly
 * <ThemedLoading message="Loading..." theme={previewTheme} />
 *
 * // Spinner only (no message)
 * <ThemedLoading />
 * ```
 */

import { Loader2 } from 'lucide-react'

import { useThemeWithOverride } from '../../hooks/useThemeWithOverride'
import { ThemedText } from './ThemedText'
import type { Theme } from '../../types'
import { cn } from '@/shared/utils'

export interface ThemedLoadingProps {
  /**
   * Optional message displayed below the spinner
   */
  message?: string

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
 * ThemedLoading - Themed loading spinner with optional message
 *
 * Applies theme.primaryColor to the Loader2 spinner icon.
 * Message text uses ThemedText for consistent themed typography.
 *
 * Layout: centered flex column with gap, fills parent via flex-1.
 */
export function ThemedLoading({
  message,
  theme: themeOverride,
  className,
}: ThemedLoadingProps) {
  const theme = useThemeWithOverride(themeOverride)

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-4 text-center',
        className,
      )}
    >
      <Loader2
        className="h-12 w-12 animate-spin opacity-60"
        style={{ color: theme.primaryColor }}
      />
      {message && <ThemedText variant="body">{message}</ThemedText>}
    </div>
  )
}
