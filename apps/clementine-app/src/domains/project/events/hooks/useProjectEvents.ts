// useProjectEvents hook
// Real-time subscription to project events list

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
import { projectEventSchema } from '../schemas/project-event.schema'
import type { ProjectEvent } from '../types/project-event.types'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * List project events with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Proper Firestore type conversion (Timestamps → numbers)
 * - TanStack Query cache integration
 * - Reusable across components
 *
 * Note: For project data (e.g., activeEventId), use useProject(projectId) separately.
 *
 * @param projectId - Project ID (determines sub-collection path)
 * @returns TanStack Query result with real-time event list
 *
 * @example
 * ```tsx
 * const { data: events, isLoading, error } = useProjectEvents(projectId)
 * const { data: project } = useProject(projectId)
 * const activeEventId = project?.activeEventId
 * ```
 */
export function useProjectEvents(projectId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for events
  useEffect(() => {
    const eventsQuery = query(
      collection(firestore, `projects/${projectId}/events`),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectEventSchema)
      )

      queryClient.setQueryData<ProjectEvent[]>(['projectEvents', projectId], events)
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, queryClient])

  return useQuery<ProjectEvent[]>({
    queryKey: ['projectEvents', projectId],
    queryFn: async () => {
      const eventsQuery = query(
        collection(firestore, `projects/${projectId}/events`),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      const eventsSnapshot = await getDocs(eventsQuery)

      return eventsSnapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectEventSchema)
      )
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
