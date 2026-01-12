/**
 * useWorkspaceExperience Hook
 *
 * Fetches a single experience by ID with real-time updates.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 * Reference: Follows same pattern as useProjectEvent hook
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'

import { experienceSchema } from '../schemas/experience.schema'
import { experienceKeys, experienceQuery } from '../queries/experience.query'
import type { Experience } from '../schemas/experience.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Hook to fetch a single experience with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Returns null if document doesn't exist (no error thrown)
 *
 * Data Flow:
 * 1. Route loader can call ensureQueryData() → Warms cache with initial data
 * 2. Component calls useWorkspaceExperience() → Returns cached data immediately
 * 3. onSnapshot listener updates cache → Component re-renders with new data
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns TanStack Query result with experience or null
 *
 * @example
 * ```tsx
 * function ExperienceEditor({ workspaceId, experienceId }) {
 *   const { data: experience, isLoading } = useWorkspaceExperience(workspaceId, experienceId)
 *
 *   if (isLoading) return <Skeleton />
 *   if (!experience) return <NotFound />
 *
 *   return <EditorForm experience={experience} />
 * }
 * ```
 */
export function useWorkspaceExperience(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const experienceRef = doc(
      firestore,
      `workspaces/${workspaceId}/experiences/${experienceId}`,
    )

    const unsubscribe = onSnapshot(experienceRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<Experience | null>(
          experienceKeys.detail(workspaceId, experienceId),
          null,
        )
        return
      }

      const experience = convertFirestoreDoc(snapshot, experienceSchema)
      queryClient.setQueryData<Experience>(
        experienceKeys.detail(workspaceId, experienceId),
        experience,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, experienceId, queryClient])

  return useQuery(experienceQuery(workspaceId, experienceId))
}
