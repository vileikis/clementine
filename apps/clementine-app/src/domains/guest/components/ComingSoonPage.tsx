/**
 * ComingSoonPage Component
 *
 * Display-only page for events that aren't published yet.
 * Used when a project has no active event or the event isn't published.
 */

interface ComingSoonPageProps {
  /** Optional custom title */
  title?: string
  /** Optional custom message */
  message?: string
}

/**
 * Coming soon page for unpublished events
 *
 * @example
 * ```tsx
 * // Default message
 * <ComingSoonPage />
 *
 * // Custom message
 * <ComingSoonPage
 *   title="Almost There!"
 *   message="This experience is being prepared. Check back soon!"
 * />
 * ```
 */
export function ComingSoonPage({
  title = 'Coming Soon',
  message = "This experience isn't ready yet. Check back soon!",
}: ComingSoonPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
