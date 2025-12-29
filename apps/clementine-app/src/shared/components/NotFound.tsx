import { Link } from '@tanstack/react-router'
import { Button } from '@/ui-kit/components/button'

interface NotFoundProps {
  /** Title for the 404 state */
  title?: string

  /** Descriptive message for the 404 state */
  message?: string

  /** Label for the action button */
  actionLabel?: string

  /** Href for the action button */
  actionHref?: string
}

/**
 * Generic 404 Not Found component
 *
 * Can be customized with different titles, messages, and actions.
 * Defaults to a generic "Page not found" message with a link to home.
 *
 * @example
 * ```tsx
 * // Generic usage
 * <NotFound />
 *
 * // Workspace not found
 * <NotFound
 *   title="Workspace Not Found"
 *   message="The workspace you're looking for doesn't exist or has been deleted."
 *   actionLabel="View All Workspaces"
 *   actionHref="/admin/workspaces"
 * />
 * ```
 */
export function NotFound({
  title = 'Page Not Found',
  message = "Sorry, we couldn't find the page you're looking for.",
  actionLabel = 'Go Home',
  actionHref = '/',
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-8">{message}</p>
        <Button asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
