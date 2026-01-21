/**
 * Guest Query Keys and Options
 *
 * TanStack Query key factory and query options for guest record fetching.
 * Guests are stored at /projects/{projectId}/guests/{guestId}
 *
 * Pattern: Query key factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { guestSchema } from '../schemas/guest.schema'
import type { Guest } from '../schemas/guest.schema'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query key factory for guest records
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const guestKeys = {
  /** Base key for all guest queries */
  all: ['guest'] as const,

  /** Key for guests within a project */
  project: (projectId: string) => [...guestKeys.all, projectId] as const,

  /** Key for specific guest record */
  record: (projectId: string, guestId: string) =>
    [...guestKeys.project(projectId), guestId] as const,
}

/**
 * Query options for fetching a specific guest record
 *
 * Returns null if guest record doesn't exist (valid state for first visit)
 *
 * @param projectId - Project ID
 * @param guestId - Guest ID (same as authUid)
 */
export function guestQuery(projectId: string, guestId: string) {
  return queryOptions<Guest | null>({
    queryKey: guestKeys.record(projectId, guestId),
    queryFn: async () => {
      const guestRef = doc(
        firestore,
        `projects/${projectId}/guests/${guestId}`,
      )
      const snapshot = await getDoc(guestRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, guestSchema)
    },
    staleTime: Infinity, // Guest record doesn't change once created
    refetchOnWindowFocus: false,
  })
}
