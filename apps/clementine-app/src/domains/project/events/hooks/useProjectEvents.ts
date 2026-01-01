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
 * - TanStack Query cache serves as the store
 * - Reusable across components
 *
 * @param projectId - Project ID (determines sub-collection path)
 * @returns TanStack Query result with real-time event list
 *
 * @example
 * ```tsx
 * const { data: events, isLoading, error } = useProjectEvents(projectId)
 * ```
 */
export function useProjectEvents(projectId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const q = query(
      collection(firestore, `projects/${projectId}/events`),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Convert docs and update query cache
      const events = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectEventSchema)
      )
      queryClient.setQueryData(['projectEvents', projectId], events)
    })

    return () => unsubscribe()
  }, [projectId, queryClient])

  return useQuery<ProjectEvent[]>({
    queryKey: ['projectEvents', projectId],
    queryFn: async () => {
      const q = query(
        collection(firestore, `projects/${projectId}/events`),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      // Initial fetch only (onSnapshot handles updates)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => convertFirestoreDoc(doc, projectEventSchema))
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
