/**
 * Session Query Keys and Options
 *
 * TanStack Query key factory and query options for session data fetching.
 * Used for consistent query key management and cache invalidation.
 *
 * Pattern: Query key factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'

import { sessionSchema } from '../schemas'
import type { Session } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query key factory for sessions
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const sessionKeys = {
  /** Base key for all session queries */
  all: ['sessions'] as const,

  /** Key for session lists */
  lists: () => [...sessionKeys.all, 'list'] as const,

  /** Key for sessions in a specific project */
  list: (projectId: string) => [...sessionKeys.lists(), projectId] as const,

  /** Key for session details */
  details: () => [...sessionKeys.all, 'detail'] as const,

  /** Key for specific session detail */
  detail: (projectId: string, sessionId: string) =>
    [...sessionKeys.details(), projectId, sessionId] as const,
}

/**
 * Query options for fetching a single session
 *
 * Used as initial fetch; real-time updates come via onSnapshot in useSubscribeSession.
 */
export function sessionQuery(projectId: string, sessionId: string) {
  return queryOptions<Session | null>({
    queryKey: sessionKeys.detail(projectId, sessionId),
    queryFn: async () => {
      const sessionRef = doc(
        firestore,
        `projects/${projectId}/sessions/${sessionId}`,
      )
      const snapshot = await getDoc(sessionRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, sessionSchema)
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
