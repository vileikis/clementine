/**
 * useGuest Hook
 *
 * Query hook for fetching an existing guest from Firestore with real-time updates.
 * Returns null if guest doesn't exist (valid state for first visit).
 *
 * Path: /projects/{projectId}/guests/{guestId}
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 * Reference: Follows same pattern as useWorkspaceExperience hook
 *
 * Note: This hook only fetches - use useCreateGuest for creating.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'

import { guestKeys, guestQuery } from '../queries/guest.query'
import { guestSchema } from '../schemas/guest.schema'
import type { Guest } from '../schemas/guest.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Hook for fetching a guest with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Returns null if document doesn't exist (no error thrown)
 *
 * Data Flow:
 * 1. Initial query fetches guest data → Populates cache
 * 2. onSnapshot listener updates cache → Component re-renders with new data
 * 3. When completedExperiences changes → Cache updated automatically
 *
 * @param projectId - Project ID
 * @param guestId - Guest ID (typically the authUid)
 * @returns TanStack Query result with guest data
 *
 * @example
 * ```tsx
 * function GuestContent({ projectId }: { projectId: string }) {
 *   const { user } = useAuth()
 *   const { data: guest, isLoading } = useGuest(projectId, user?.uid ?? '')
 *
 *   if (isLoading) return <Loading />
 *   if (!guest) return <div>First visit - creating guest...</div>
 *
 *   return <div>Welcome back, guest {guest.id}!</div>
 * }
 * ```
 */
export function useGuest(projectId: string, guestId: string) {
  const queryClient = useQueryClient()
  const enabled = Boolean(projectId) && Boolean(guestId)

  // Set up real-time listener
  useEffect(() => {
    if (!enabled) return

    const guestRef = doc(firestore, `projects/${projectId}/guests/${guestId}`)

    const unsubscribe = onSnapshot(guestRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<Guest | null>(
          guestKeys.record(projectId, guestId),
          null,
        )
        return
      }

      const guest = convertFirestoreDoc(snapshot, guestSchema)
      queryClient.setQueryData<Guest>(
        guestKeys.record(projectId, guestId),
        guest,
      )
    })

    return () => unsubscribe()
  }, [projectId, guestId, enabled, queryClient])

  return useQuery({
    ...guestQuery(projectId, guestId),
    enabled,
  })
}
