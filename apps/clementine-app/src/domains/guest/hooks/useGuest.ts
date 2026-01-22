/**
 * useGuest Hook
 *
 * Query hook for fetching an existing guest from Firestore.
 * Returns null if guest doesn't exist (valid state for first visit).
 *
 * Path: /projects/{projectId}/guests/{guestId}
 *
 * Note: This hook only fetches - use useCreateGuest for creating.
 */
import { useQuery } from '@tanstack/react-query'
import { guestQuery } from '../queries/guest.query'

/**
 * Hook for fetching a guest
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
  return useQuery({
    ...guestQuery(projectId, guestId),
    enabled: Boolean(projectId) && Boolean(guestId),
  })
}
