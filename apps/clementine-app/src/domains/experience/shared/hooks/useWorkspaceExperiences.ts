/**
 * useWorkspaceExperiences Hook
 *
 * Lists all active experiences in a workspace with optional type filtering.
 * Features real-time updates via Firestore onSnapshot listener.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 *
 * @see specs/081-experience-type-flattening — US2
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
import type { Experience, ExperienceType } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Filter options for experience list
 */
export interface ExperienceFilters {
  /** Filter by experience type */
  type?: ExperienceType
}

/**
 * Hook to list workspace experiences with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Filters to status === 'active' (excludes soft-deleted)
 * - Optional type filtering
 * - Sorted by createdAt descending (newest first)
 *
 * @param workspaceId - Workspace ID to fetch experiences from
 * @param filters - Optional filter by experience type
 * @returns TanStack Query result with experiences array
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

    // Build query with status filter and optional type filter
    let q = query(
      experiencesRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    if (filters?.type) {
      q = query(
        experiencesRef,
        where('status', '==', 'active'),
        where('type', '==', filters.type),
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
  }, [workspaceId, filters?.type, queryClient])

  return useQuery(experiencesQuery(workspaceId, filters))
}
