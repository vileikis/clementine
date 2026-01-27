/**
 * useGuestValidation Hook
 *
 * Validates guest access to a project by checking project existence
 * and publish status. Project now contains config directly.
 *
 * Pattern: Discriminated union return type for clear state handling
 */
import type { Project } from '@clementine/shared'
import { useProject } from '@/domains/project/shared/hooks/useProject'

/**
 * Discriminated union for guest validation states
 */
export type GuestValidationState =
  | { status: 'loading' }
  | { status: 'not-found'; reason: 'project' }
  | { status: 'coming-soon'; reason: 'not-published' }
  | {
      status: 'ready'
      project: Project
    }

/**
 * Hook for validating guest access to a project
 *
 * Validation flow:
 * 1. Load project by ID
 * 2. Check project exists (404 if not)
 * 3. Check project has publishedConfig (Coming Soon if not)
 * 4. Return ready state with project
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
 *   const { project } = validation
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

  if (projectLoading) {
    return { status: 'loading' }
  }

  // Step 2: Check project exists
  if (projectFetched && !project) {
    return { status: 'not-found', reason: 'project' }
  }

  // Step 3: Check project has published config
  if (project && !project.publishedConfig) {
    return { status: 'coming-soon', reason: 'not-published' }
  }

  // Step 4: Return ready state
  if (project && project.publishedConfig) {
    return {
      status: 'ready',
      project,
    }
  }

  // Default to loading while queries are in flight
  return { status: 'loading' }
}
