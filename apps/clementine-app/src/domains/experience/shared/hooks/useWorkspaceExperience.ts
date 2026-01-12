/**
 * useWorkspaceExperience Hook
 *
 * Fetches a single experience by ID with real-time updates.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'

import { experienceSchema } from '../schemas/experience.schema'
import { experienceKeys } from '../queries/experience.query'
import type { Experience } from '../schemas/experience.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Hook to fetch a single experience with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Returns null if document doesn't exist (no error thrown)
 * - Validates document against experienceSchema
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
        queryClient.setQueryData(
          experienceKeys.detail(workspaceId, experienceId),
          null,
        )
        return
      }

      const experience = convertFirestoreDoc(snapshot, experienceSchema)
      queryClient.setQueryData(
        experienceKeys.detail(workspaceId, experienceId),
        experience,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, experienceId, queryClient])

  return useQuery<Experience | null>({
    queryKey: experienceKeys.detail(workspaceId, experienceId),
    queryFn: async () => {
      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences/${experienceId}`,
      )

      const snapshot = await getDoc(experienceRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, experienceSchema)
    },
    staleTime: Infinity, // Data kept fresh by onSnapshot listener
    refetchOnWindowFocus: false,
  })
}
