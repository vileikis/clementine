/**
 * ErrorPage Component
 *
 * Display-only error page for guest-facing 404 errors.
 * Used when a project or event doesn't exist.
 */

interface ErrorPageProps {
  /** Optional custom title (defaults to "404") */
  title?: string
  /** Optional custom message */
  message?: string
}

/**
 * Error page for invalid guest access
 *
 * @example
 * ```tsx
 * // Default 404
 * <ErrorPage />
 *
 * // Custom message
 * <ErrorPage title="Not Found" message="This experience doesn't exist" />
 * ```
 */
export function ErrorPage({
  title = '404',
  message = "This page doesn't exist",
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-foreground">{title}</h1>
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
