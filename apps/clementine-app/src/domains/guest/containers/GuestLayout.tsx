/**
 * GuestLayout Container
 *
 * Layout container that handles all guest initialization and renders children
 * only when ready. Uses TanStack Router's Outlet to render child routes.
 *
 * Two-phase loading:
 * - Phase 1: Auth, project/event validation, guest record (blocking)
 * - Phase 2: Experiences (lazy-loaded after Phase 1)
 *
 * Responsibilities:
 * 1. Initialize authentication (anonymous sign-in if needed)
 * 2. Validate guest access (project, event, publish status)
 * 3. Initialize guest record (fetch or create)
 * 4. Lazy-load experiences after validation passes
 * 5. Render error/loading states
 * 6. Provide context to child routes when ready
 *
 * User Stories:
 * - US1: Guest Accesses Event via Shareable Link
 * - US3: Guest Encounters Invalid or Unavailable Event
 */
import { Outlet } from '@tanstack/react-router'

import { ComingSoonPage, ErrorPage } from '../components'
import { GuestProvider } from '../contexts'
import { useGuestPageInit } from '../hooks/useGuestPageInit'
import type { ProjectEventFull } from '@/domains/event/shared'
import type { GuestContextValue } from '../contexts'
import { useExperiencesByIds } from '@/domains/experience/shared'

export interface GuestLayoutProps {
  /** Project ID from URL params */
  projectId: string
}

/**
 * Extract all experience IDs from published config
 * Includes: main experiences, pregate experience, and preshare experience
 */
function getAllExperienceIds(
  publishedConfig: ProjectEventFull['publishedConfig'],
): string[] {
  const ids: string[] = []

  // Add main experiences
  const mainIds =
    publishedConfig?.experiences?.main
      ?.filter((ref) => ref.enabled)
      ?.map((ref) => ref.experienceId) ?? []
  ids.push(...mainIds)

  // Add pregate experience if configured
  const pregateId = publishedConfig?.experiences?.pregate?.experienceId
  if (pregateId) {
    ids.push(pregateId)
  }

  // Add preshare experience if configured
  const preshareId = publishedConfig?.experiences?.preshare?.experienceId
  if (preshareId) {
    ids.push(preshareId)
  }

  // Remove duplicates (in case same experience is used in multiple places)
  return [...new Set(ids)]
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
  // Phase 1: Auth + validation + guest (always called)
  const baseState = useGuestPageInit(projectId)

  // Phase 2: Experiences (always called, enabled controls execution)
  // Must be called unconditionally to follow Rules of Hooks
  const isReady = baseState.status === 'ready'
  const workspaceId = isReady ? baseState.project.workspaceId : ''
  const enabledIds = isReady
    ? getAllExperienceIds(baseState.event.publishedConfig)
    : []

  const experiencesQuery = useExperiencesByIds(workspaceId, enabledIds, {
    enabled: isReady,
  })

  // Handle authentication error
  if (baseState.status === 'auth-error') {
    return (
      <ErrorPage title="Authentication Error" message={baseState.message} />
    )
  }

  // Handle not-found state (project or event missing)
  if (baseState.status === 'not-found') {
    const message =
      baseState.reason === 'project'
        ? "This project doesn't exist"
        : "This event doesn't exist"
    return <ErrorPage message={message} />
  }

  // Handle coming-soon state (no active event or not published)
  if (baseState.status === 'coming-soon') {
    const message =
      baseState.reason === 'no-active-event'
        ? "This experience isn't available yet. Check back soon!"
        : 'This experience is being prepared. Check back soon!'
    return <ComingSoonPage message={message} />
  }

  // Handle generic error
  if (baseState.status === 'error') {
    return (
      <ErrorPage
        title="Error"
        message="Failed to initialize. Please refresh the page."
      />
    )
  }

  // Show loading state (Phase 1 not complete)
  if (baseState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    )
  }

  // baseState.status === 'ready' - build context with experiences
  const contextValue: GuestContextValue = {
    user: baseState.user,
    project: baseState.project,
    event: baseState.event,
    guest: baseState.guest,
    experiences: experiencesQuery.data ?? [],
    experiencesLoading: experiencesQuery.isLoading,
  }

  return (
    <GuestProvider value={contextValue}>
      <Outlet />
    </GuestProvider>
  )
}
