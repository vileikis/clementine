/**
 * useWorkspaceExperience Hook
 *
 * Fetch a single workspace experience with real-time updates.
 * Uses Firestore onSnapshot for real-time subscriptions
 * and TanStack Query for cache management.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { workspaceExperienceSchema } from '../schemas'
import { workspaceExperienceQuery } from '../queries/workspace-experience.query'
import type { WorkspaceExperience } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Fetch a single workspace experience with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Returns null if experience doesn't exist
 *
 * @param workspaceId - Workspace ID containing the experience
 * @param experienceId - Experience ID to fetch
 * @returns TanStack Query result with real-time experience data
 *
 * @example
 * ```tsx
 * const { data: experience, isLoading } = useWorkspaceExperience(
 *   workspaceId,
 *   experienceId
 * )
 *
 * if (isLoading) return <div>Loading...</div>
 * if (!experience) return <div>Experience not found</div>
 *
 * return <ExperienceEditor experience={experience} />
 * ```
 */
export function useWorkspaceExperience(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()

  // Set up real-time listener for single experience
  useEffect(() => {
    const experienceRef = doc(
      firestore,
      `workspaces/${workspaceId}/experiences`,
      experienceId,
    )

    const unsubscribe = onSnapshot(experienceRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<WorkspaceExperience | null>(
          ['workspaceExperience', workspaceId, experienceId],
          null,
        )
        return
      }

      const experience = convertFirestoreDoc(
        snapshot,
        workspaceExperienceSchema,
      )

      queryClient.setQueryData<WorkspaceExperience>(
        ['workspaceExperience', workspaceId, experienceId],
        experience,
      )
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, experienceId, queryClient])

  return useQuery({
    ...workspaceExperienceQuery(workspaceId, experienceId),
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
