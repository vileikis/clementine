/**
 * ThemedLoadingState Component
 *
 * Loading content with themed styling (spinner + message).
 * Does NOT include ThemedBackground - expects parent to provide it.
 *
 * Must be used within a ThemeProvider and ThemedBackground.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={event.theme}>
 *   <ThemedBackground className="h-screen">
 *     <ThemedLoadingState message="Loading experience..." />
 *   </ThemedBackground>
 * </ThemeProvider>
 * ```
 */
import { ThemedText, useEventTheme } from '@/shared/theming'

export interface ThemedLoadingStateProps {
  /** Loading message to display (defaults to "Loading...") */
  message?: string
}

/**
 * Themed loading content with spinner and message
 */
export function ThemedLoadingState({
  message = 'Loading...',
}: ThemedLoadingStateProps) {
  const { theme } = useEventTheme()

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      {/* Spinner using primary color */}
      <div
        className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
        style={{
          borderColor: `${theme.primaryColor} transparent transparent transparent`,
        }}
      />
      <ThemedText variant="body">{message}</ThemedText>
    </div>
  )
}
