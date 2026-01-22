/**
 * useExperiencesByIds Hook
 *
 * Fetches multiple experiences by their IDs in a single batch query.
 * Designed for guest-facing contexts where real-time updates aren't needed.
 *
 * Uses Firestore documentId() 'in' clause for efficient batch fetching.
 * Limited to 30 IDs per Firestore constraints.
 */
import { useQuery } from '@tanstack/react-query'

import { experiencesByIdsQuery } from '../queries/experience.query'

export interface UseExperiencesByIdsOptions {
  /** Whether the query should execute (default: true if IDs provided) */
  enabled?: boolean
}

/**
 * Hook to fetch multiple experiences by IDs
 *
 * Features:
 * - Single batch query (not N individual queries)
 * - TanStack Query caching
 * - No real-time subscription (suitable for guest contexts)
 *
 * @param workspaceId - Workspace containing the experiences
 * @param experienceIds - Array of experience IDs to fetch
 * @param options - Query options (enabled)
 * @returns TanStack Query result with experiences array
 *
 * @example
 * ```tsx
 * function WelcomeScreen({ workspaceId, enabledExperienceIds }) {
 *   const { data: experiences, isLoading } = useExperiencesByIds(
 *     workspaceId,
 *     enabledExperienceIds,
 *   )
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return experiences.map(exp => <ExperienceCard key={exp.id} experience={exp} />)
 * }
 * ```
 */
export function useExperiencesByIds(
  workspaceId: string,
  experienceIds: string[],
  options?: UseExperiencesByIdsOptions,
) {
  const defaultEnabled = experienceIds.length > 0 && !!workspaceId

  return useQuery({
    ...experiencesByIdsQuery(workspaceId, experienceIds),
    enabled: options?.enabled ?? defaultEnabled,
  })
}
