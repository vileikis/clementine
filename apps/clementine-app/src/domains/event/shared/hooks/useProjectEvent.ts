/**
 * useProjectEvent Hook
 *
 * Real-time subscription to project event data with TanStack Query integration.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 * Reference: Follows same pattern as useProject hook
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { projectEventFullSchema } from '../schemas'
import { projectEventQuery } from '../queries/project-event.query'
import type { ProjectEventFull } from '../schemas'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { firestore } from '@/integrations/firebase/client'

/**
 * Fetch project event with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Immediate data availability (if loader pre-warmed cache)
 * - Type-safe with full TypeScript inference
 *
 * Data Flow:
 * 1. Route loader calls ensureQueryData() → Warms cache with initial data
 * 2. Component calls useProjectEvent() → Returns cached data immediately
 * 3. onSnapshot listener updates cache → Component re-renders with new data
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID
 * @returns TanStack Query result with real-time event data
 *
 * @example
 * ```tsx
 * function EventLayout() {
 *   const { projectId, eventId } = Route.useParams()
 *   const { data: event } = useProjectEvent(projectId, eventId)
 *
 *   // Data immediately available (from loader cache)
 *   // Updates automatically when Firestore document changes
 *   return <div>{event?.name}</div>
 * }
 * ```
 */
export function useProjectEvent(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for event
  useEffect(() => {
    const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)

    const unsubscribe = onSnapshot(eventRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<ProjectEventFull | null>(
          ['project-event', projectId, eventId],
          null,
        )
        return
      }

      // Convert Firestore document (Timestamps → numbers) and validate with schema
      const event = convertFirestoreDoc(snapshot, projectEventFullSchema)

      queryClient.setQueryData<ProjectEventFull>(
        ['project-event', projectId, eventId],
        event,
      )
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, eventId, queryClient])

  return useQuery(projectEventQuery(projectId, eventId))
}
