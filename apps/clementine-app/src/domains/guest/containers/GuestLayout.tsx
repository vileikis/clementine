/**
 * GuestLayout Container
 *
 * Layout container that handles all guest initialization and renders children
 * only when ready. Uses TanStack Router's Outlet to render child routes.
 *
 * Responsibilities:
 * 1. Initialize authentication (anonymous sign-in if needed)
 * 2. Validate guest access (project, event, publish status)
 * 3. Initialize guest record (fetch or create)
 * 4. Render error/loading states
 * 5. Provide context to child routes when ready
 *
 * User Stories:
 * - US1: Guest Accesses Event via Shareable Link
 * - US3: Guest Encounters Invalid or Unavailable Event
 */
import { Outlet } from '@tanstack/react-router'
import { ComingSoonPage, ErrorPage } from '../components'
import { GuestProvider } from '../contexts'
import { useGuestPageInit } from '../hooks/useGuestPageInit'

export interface GuestLayoutProps {
  /** Project ID from URL params */
  projectId: string
}

/**
 * Guest layout container with initialization
 *
 * Handles all non-ready states (loading, errors, coming-soon) internally
 * and only renders children (via GuestProvider + Outlet) when ready.
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/route.tsx
 * export const Route = createFileRoute('/join/$projectId')({
 *   component: GuestLayoutRoute,
 * })
 *
 * function GuestLayoutRoute() {
 *   const { projectId } = Route.useParams()
 *   return <GuestLayout projectId={projectId} />
 * }
 * ```
 */
export function GuestLayout({ projectId }: GuestLayoutProps) {
  const state = useGuestPageInit(projectId)

  // Handle authentication error
  if (state.status === 'auth-error') {
    return <ErrorPage title="Authentication Error" message={state.message} />
  }

  // Handle not-found state (project or event missing)
  if (state.status === 'not-found') {
    const message =
      state.reason === 'project'
        ? "This project doesn't exist"
        : "This event doesn't exist"
    return <ErrorPage message={message} />
  }

  // Handle coming-soon state (no active event or not published)
  if (state.status === 'coming-soon') {
    const message =
      state.reason === 'no-active-event'
        ? "This experience isn't available yet. Check back soon!"
        : 'This experience is being prepared. Check back soon!'
    return <ComingSoonPage message={message} />
  }

  // Handle generic error
  if (state.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to initialize. Please refresh the page."
      />
    )
  }

  // Show loading state
  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    )
  }

  // state.status === 'ready' - render children with context
  return (
    <GuestProvider value={state}>
      <Outlet />
    </GuestProvider>
  )
}
