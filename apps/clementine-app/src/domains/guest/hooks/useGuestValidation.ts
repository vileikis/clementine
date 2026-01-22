/**
 * useGuestValidation Hook
 *
 * Validates guest access to a project by checking project and event existence
 * and publish status. Does NOT load experiences - that's handled separately
 * by GuestLayout for lazy loading.
 *
 * Pattern: Discriminated union return type for clear state handling
 */
import type { Project } from '@clementine/shared'
import type { ProjectEventFull } from '@/domains/event/shared'
import { useProject } from '@/domains/project/shared/hooks/useProject'
import { useProjectEvent } from '@/domains/event/shared/hooks/useProjectEvent'

/**
 * Discriminated union for guest validation states
 */
export type GuestValidationState =
  | { status: 'loading' }
  | { status: 'not-found'; reason: 'project' | 'event' }
  | { status: 'coming-soon'; reason: 'no-active-event' | 'not-published' }
  | {
      status: 'ready'
      project: Project
      event: ProjectEventFull
    }

/**
 * Hook for validating guest access to a project
 *
 * Validation flow:
 * 1. Load project by ID
 * 2. Check project exists (404 if not)
 * 3. Check project has activeEventId (Coming Soon if not)
 * 4. Load active event
 * 5. Check event exists (404 if not)
 * 6. Check event has publishedConfig (Coming Soon if not)
 * 7. Return ready state with project and event
 *
 * Note: Experience loading is NOT handled here. GuestLayout fetches
 * experiences separately after validation passes for lazy loading.
 *
 * @param projectId - Project ID from URL params
 * @returns Discriminated union state for rendering
 *
 * @example
 * ```tsx
 * function GuestLayout({ projectId }: { projectId: string }) {
 *   const validation = useGuestValidation(projectId)
 *
 *   if (validation.status === 'loading') return <LoadingSkeleton />
 *   if (validation.status === 'not-found') return <ErrorPage />
 *   if (validation.status === 'coming-soon') return <ComingSoonPage />
 *
 *   // validation.status === 'ready'
 *   const { project, event } = validation
 *   // Now fetch experiences...
 * }
 * ```
 */
export function useGuestValidation(projectId: string): GuestValidationState {
  // Step 1: Load project
  const {
    data: project,
    isLoading: projectLoading,
    isFetched: projectFetched,
  } = useProject(projectId)

  // Step 2-3: Determine active event ID (or null if project missing/no active event)
  const activeEventId = project?.activeEventId ?? null

  // Step 4: Load event (enabled only when we have an activeEventId)
  const {
    data: event,
    isLoading: eventLoading,
    isFetched: eventFetched,
  } = useProjectEvent(projectId, activeEventId ?? '')

  // Determine overall loading state
  const isLoading = projectLoading || (activeEventId && eventLoading)

  if (isLoading) {
    return { status: 'loading' }
  }

  // Step 2: Check project exists
  if (projectFetched && !project) {
    return { status: 'not-found', reason: 'project' }
  }

  // Step 3: Check project has active event
  if (project && !activeEventId) {
    return { status: 'coming-soon', reason: 'no-active-event' }
  }

  // Step 5: Check event exists
  if (activeEventId && eventFetched && !event) {
    return { status: 'not-found', reason: 'event' }
  }

  // Step 6: Check event has published config
  if (event && !event.publishedConfig) {
    return { status: 'coming-soon', reason: 'not-published' }
  }

  // Step 7: Return ready state
  if (project && event && event.publishedConfig) {
    return {
      status: 'ready',
      project,
      event,
    }
  }

  // Default to loading while queries are in flight
  return { status: 'loading' }
}
