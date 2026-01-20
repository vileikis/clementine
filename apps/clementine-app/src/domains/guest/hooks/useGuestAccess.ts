/**
 * useGuestAccess Hook
 *
 * Validates guest access to a project and returns all data needed to render
 * the welcome screen. Combines project and event validation with experience loading.
 *
 * Pattern: Discriminated union return type for clear state handling
 * Reference: Follows useSubscribeSession pattern for query structure
 */
import { useQueries } from '@tanstack/react-query'
import type { Project } from '@clementine/shared'
import type { ProjectEventFull } from '@/domains/event/shared'
import type { Experience } from '@/domains/experience/shared'
import { useProject } from '@/domains/project/shared/hooks/useProject'
import { useProjectEvent } from '@/domains/event/shared/hooks/useProjectEvent'
import { experienceQuery } from '@/domains/experience/shared'

/**
 * Minimal experience data needed for card display
 */
export interface ExperienceCardData {
  /** Experience document ID */
  id: string
  /** Display name */
  name: string
  /** Thumbnail URL (null if no media) */
  thumbnailUrl: string | null
}

/**
 * Discriminated union for guest access validation states
 */
export type GuestAccessState =
  | { status: 'loading' }
  | { status: 'not-found'; reason: 'project' | 'event' }
  | { status: 'coming-soon'; reason: 'no-active-event' | 'not-published' }
  | {
      status: 'ready'
      project: Project
      event: ProjectEventFull
      experiences: ExperienceCardData[]
    }

/**
 * Hook for validating guest access and loading welcome screen data
 *
 * Validation flow:
 * 1. Load project by ID
 * 2. Check project exists (404 if not)
 * 3. Check project has activeEventId (Coming Soon if not)
 * 4. Load active event
 * 5. Check event exists (404 if not)
 * 6. Check event has publishedConfig (Coming Soon if not)
 * 7. Load enabled experiences from publishedConfig
 * 8. Return ready state with all data
 *
 * @param projectId - Project ID from URL params
 * @returns Discriminated union state for rendering
 *
 * @example
 * ```tsx
 * function WelcomeScreen({ projectId }: { projectId: string }) {
 *   const access = useGuestAccess(projectId)
 *
 *   if (access.status === 'loading') return <LoadingSkeleton />
 *   if (access.status === 'not-found') return <ErrorPage />
 *   if (access.status === 'coming-soon') return <ComingSoonPage />
 *
 *   // TypeScript knows access.status === 'ready' here
 *   const { project, event, experiences } = access
 *   return <WelcomeContent project={project} event={event} experiences={experiences} />
 * }
 * ```
 */
export function useGuestAccess(projectId: string): GuestAccessState {
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

  // Step 5-6: Get enabled experience IDs from published config
  const enabledExperienceRefs =
    event?.publishedConfig?.experiences?.main?.filter((ref) => ref.enabled) ??
    []

  // Step 7: Load experience details for all enabled experiences
  const workspaceId = project?.workspaceId ?? ''

  const experienceQueries = useQueries({
    queries: enabledExperienceRefs.map((ref) => ({
      ...experienceQuery(workspaceId, ref.experienceId),
      enabled: !!workspaceId && !!event?.publishedConfig,
    })),
  })

  const experiencesLoading = experienceQueries.some((q) => q.isLoading)
  const experiencesFetched = experienceQueries.every((q) => q.isFetched)

  // Determine overall loading state
  const isLoading =
    projectLoading ||
    (activeEventId && eventLoading) ||
    (event?.publishedConfig && experiencesLoading)

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

  // Step 8: Return ready state
  if (project && event && event.publishedConfig && experiencesFetched) {
    // Convert loaded experiences to card data
    const experiences: ExperienceCardData[] = experienceQueries
      .map((q) => q.data)
      .filter((exp): exp is Experience => exp !== null && exp !== undefined)
      .filter((exp) => exp.status === 'active')
      .map((exp) => ({
        id: exp.id,
        name: exp.name,
        thumbnailUrl: exp.media?.url ?? null,
      }))

    return {
      status: 'ready',
      project,
      event,
      experiences,
    }
  }

  // Default to loading while queries are in flight
  return { status: 'loading' }
}
