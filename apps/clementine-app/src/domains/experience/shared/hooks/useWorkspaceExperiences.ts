/**
 * useWorkspaceExperiences Hook
 *
 * Fetch workspace experiences list with real-time updates.
 * Uses Firestore onSnapshot for real-time subscriptions
 * and TanStack Query for cache management.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { workspaceExperienceSchema } from '../schemas'
import { workspaceExperiencesQuery } from '../queries/workspace-experiences.query'
import type {
  FirestoreError} from 'firebase/firestore';
import type { WorkspaceExperience } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Fetch workspace experiences with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Filters by status='active' (excludes deleted)
 * - Sorts by updatedAt DESC (most recently updated first)
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 *
 * @param workspaceId - Workspace ID to fetch experiences for
 * @returns TanStack Query result with real-time experiences data
 *
 * @example
 * ```tsx
 * const { data: experiences, isLoading, error } = useWorkspaceExperiences(workspaceId)
 *
 * if (isLoading) return <div>Loading...</div>
 * if (!experiences?.length) return <div>No experiences yet</div>
 *
 * return experiences.map(exp => <ExperienceCard key={exp.id} experience={exp} />)
 * ```
 */
export function useWorkspaceExperiences(workspaceId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for experiences
  useEffect(() => {
    const experiencesRef = collection(
      firestore,
      `workspaces/${workspaceId}/experiences`,
    )

    const q = query(
      experiencesRef,
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc'),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const experiences = snapshot.docs.map((doc) =>
          convertFirestoreDoc(doc, workspaceExperienceSchema),
        )

        queryClient.setQueryData<WorkspaceExperience[]>(
          ['workspaceExperiences', workspaceId],
          experiences,
        )
      },
      (error: FirestoreError) => {
        Sentry.captureException(error, {
          tags: {
            domain: 'experience',
            action: 'experiences-snapshot-listener',
          },
          extra: {
            workspaceId,
          },
        })

        // Set to empty array to indicate data is unavailable
        queryClient.setQueryData<WorkspaceExperience[]>(
          ['workspaceExperiences', workspaceId],
          [],
        )
      },
    )

    return () => {
      unsubscribe()
    }
  }, [workspaceId, queryClient])

  return useQuery({
    ...workspaceExperiencesQuery(workspaceId),
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
