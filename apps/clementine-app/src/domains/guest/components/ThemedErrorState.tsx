/**
 * ThemedErrorState Component
 *
 * Error content with themed styling (title + message + optional action).
 * Does NOT include ThemedBackground - expects parent to provide it.
 *
 * Must be used within a ThemeProvider and ThemedBackground.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={event.theme}>
 *   <ThemedBackground className="h-screen">
 *     <ThemedErrorState
 *       title="Experience Not Available"
 *       message="This experience is not available."
 *       actionLabel="Go Back"
 *       onAction={() => navigate(-1)}
 *     />
 *   </ThemedBackground>
 * </ThemeProvider>
 * ```
 */
import { ThemedButton, ThemedText } from '@/shared/theming'

export interface ThemedErrorStateProps {
  /** Error title (defaults to "Error") */
  title?: string
  /** Error message to display */
  message: string
  /** Action button label (if action is provided) */
  actionLabel?: string
  /** Action callback (optional - if not provided, no button shown) */
  onAction?: () => void
}

/**
 * Themed error content with title, message, and optional action button
 */
export function ThemedErrorState({
  title = 'Error',
  message,
  actionLabel = 'Go Back',
  onAction,
}: ThemedErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <ThemedText variant="heading" as="h1" className="mb-4">
        {title}
      </ThemedText>
      <ThemedText variant="body" className="mb-6">
        {message}
      </ThemedText>
      {onAction && (
        <ThemedButton variant="outline" onClick={onAction}>
          {actionLabel}
        </ThemedButton>
      )}
    </div>
  )
}
