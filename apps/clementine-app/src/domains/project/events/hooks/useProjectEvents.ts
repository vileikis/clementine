// useProjectEvents hook
// Real-time subscription to project events list with active event tracking

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
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

export interface ProjectEventsResult {
  events: ProjectEvent[]
  activeEventId: string | null
}

/**
 * List project events with real-time updates and active event tracking
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot (events + activeEventId)
 * - Proper Firestore type conversion (Timestamps → numbers)
 * - TanStack Query cache serves as the store
 * - Reusable across components
 * - Returns both events list and active event ID
 *
 * @param projectId - Project ID (determines sub-collection path)
 * @returns TanStack Query result with real-time event list and activeEventId
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProjectEvents(projectId)
 * const events = data?.events ?? []
 * const activeEventId = data?.activeEventId
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

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      // Convert docs and update query cache (events only)
      const events = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectEventSchema)
      )

      // Preserve activeEventId from cache when updating events
      const currentData = queryClient.getQueryData<ProjectEventsResult>([
        'projectEvents',
        projectId,
      ])
      queryClient.setQueryData<ProjectEventsResult>(['projectEvents', projectId], {
        events,
        activeEventId: currentData?.activeEventId ?? null,
      })
    })

    // Set up real-time listener for project (activeEventId)
    const projectRef = doc(firestore, 'projects', projectId)
    const unsubscribeProject = onSnapshot(projectRef, (snapshot) => {
      const projectData = snapshot.data()
      const activeEventId = projectData?.activeEventId ?? null

      // Preserve events from cache when updating activeEventId
      const currentData = queryClient.getQueryData<ProjectEventsResult>([
        'projectEvents',
        projectId,
      ])
      queryClient.setQueryData<ProjectEventsResult>(['projectEvents', projectId], {
        events: currentData?.events ?? [],
        activeEventId,
      })
    })

    return () => {
      unsubscribeEvents()
      unsubscribeProject()
    }
  }, [projectId, queryClient])

  return useQuery<ProjectEventsResult>({
    queryKey: ['projectEvents', projectId],
    queryFn: async () => {
      // Initial fetch: get events and activeEventId
      const eventsQuery = query(
        collection(firestore, `projects/${projectId}/events`),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      const [eventsSnapshot, projectSnapshot] = await Promise.all([
        getDocs(eventsQuery),
        getDoc(doc(firestore, 'projects', projectId)),
      ])

      const events = eventsSnapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectEventSchema)
      )
      const activeEventId = projectSnapshot.data()?.activeEventId ?? null

      return { events, activeEventId }
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
