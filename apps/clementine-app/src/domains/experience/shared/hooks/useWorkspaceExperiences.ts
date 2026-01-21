/**
 * useWorkspaceExperiences Hook
 *
 * Lists all active experiences in a workspace with optional profile filtering.
 * Features real-time updates via Firestore onSnapshot listener.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { experienceSchema } from '../schemas'
import { experienceKeys, experiencesQuery } from '../queries/experience.query'
import type { Experience, ExperienceProfile } from '../schemas'
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
 * - TanStack Query cache integration
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
      const experiences = snapshot.docs.map((docSnapshot) =>
        convertFirestoreDoc(docSnapshot, experienceSchema),
      )
      queryClient.setQueryData<Experience[]>(
        experienceKeys.list(workspaceId, filters),
        experiences,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, filters?.profile, queryClient])

  return useQuery(experiencesQuery(workspaceId, filters))
}
