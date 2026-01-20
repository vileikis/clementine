/**
 * Guest Access Query Keys and Options
 *
 * TanStack Query key factory and query options for guest access data fetching.
 * Used for consistent query key management and cache invalidation.
 *
 * Pattern: Query key factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import type { Project } from '@clementine/shared'

/**
 * Query key factory for guest access
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const guestAccessKeys = {
  /** Base key for all guest access queries */
  all: ['guest-access'] as const,

  /** Key for project details */
  details: () => [...guestAccessKeys.all, 'detail'] as const,

  /** Key for specific project detail */
  detail: (projectId: string) =>
    [...guestAccessKeys.details(), projectId] as const,
}

/**
 * Query options for fetching project for guest access
 *
 * Used as initial fetch; real-time updates come via onSnapshot in useGuestAccess.
 */
export function guestAccessProjectQuery(projectId: string) {
  return queryOptions<Project | null>({
    queryKey: guestAccessKeys.detail(projectId),
    queryFn: async () => {
      const projectRef = doc(firestore, 'projects', projectId)
      const snapshot = await getDoc(projectRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, projectSchema)
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
