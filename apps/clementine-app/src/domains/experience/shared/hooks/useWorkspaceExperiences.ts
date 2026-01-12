/**
 * useWorkspaceExperiences Hook
 *
 * Lists all active experiences in a workspace with optional profile filtering.
 * Features real-time updates via Firestore onSnapshot listener.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { experienceSchema } from '../schemas/experience.schema'
import { experienceKeys } from '../queries/experience.query'
import type {
  Experience,
  ExperienceProfile,
} from '../schemas/experience.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Filter options for experience list
 */
export interface ExperienceFilters {
  /** Filter by profile type */
  profile?: ExperienceProfile
}

/**
 * Hook to list workspace experiences with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Filters to status === 'active' (excludes soft-deleted)
 * - Optional profile filtering
 * - Sorted by createdAt descending (newest first)
 *
 * @param workspaceId - Workspace ID to fetch experiences from
 * @param filters - Optional filter by profile type
 * @returns TanStack Query result with experiences array
 *
 * @example
 * ```tsx
 * function ExperiencesList({ workspaceId }) {
 *   const { data: experiences, isLoading } = useWorkspaceExperiences(workspaceId)
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return experiences.map(exp => <ExperienceCard key={exp.id} experience={exp} />)
 * }
 * ```
 */
export function useWorkspaceExperiences(
  workspaceId: string,
  filters?: ExperienceFilters,
) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const experiencesRef = collection(
      firestore,
      `workspaces/${workspaceId}/experiences`,
    )

    // Build query with status filter and optional profile filter
    let q = query(
      experiencesRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    if (filters?.profile) {
      q = query(
        experiencesRef,
        where('status', '==', 'active'),
        where('profile', '==', filters.profile),
        orderBy('createdAt', 'desc'),
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, experienceSchema),
      )
      queryClient.setQueryData(
        experienceKeys.list(workspaceId, filters),
        experiences,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, filters?.profile, queryClient])

  return useQuery<Experience[]>({
    queryKey: experienceKeys.list(workspaceId, filters),
    queryFn: async () => {
      const experiencesRef = collection(
        firestore,
        `workspaces/${workspaceId}/experiences`,
      )

      let q = query(
        experiencesRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
      )

      if (filters?.profile) {
        q = query(
          experiencesRef,
          where('status', '==', 'active'),
          where('profile', '==', filters.profile),
          orderBy('createdAt', 'desc'),
        )
      }

      // Initial fetch
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, experienceSchema),
      )
    },
    staleTime: Infinity, // Data kept fresh by onSnapshot listener
    refetchOnWindowFocus: false,
  })
}
