/**
 * Experience Query Options Factories
 *
 * TanStack Query options factories for experience data fetching.
 * Used in route loaders and components for consistent query configuration.
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { experienceSchema } from '../schemas'
import type { Experience, ExperienceProfile } from '../schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query key factory for experiences
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const experienceKeys = {
  /** Base key for all experience queries */
  all: ['experiences'] as const,

  /** Key for experience lists */
  lists: () => [...experienceKeys.all, 'list'] as const,

  /** Key for specific workspace list with optional filters */
  list: (workspaceId: string, filters?: { profile?: ExperienceProfile }) =>
    [...experienceKeys.lists(), workspaceId, filters] as const,

  /** Key for experience details */
  details: () => [...experienceKeys.all, 'detail'] as const,

  /** Key for specific experience detail */
  detail: (workspaceId: string, experienceId: string) =>
    [...experienceKeys.details(), workspaceId, experienceId] as const,
}

/**
 * Query options for fetching experiences list
 *
 * Note: staleTime=Infinity because data is kept fresh by onSnapshot listener in hooks
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param filters - Optional filters (profile type)
 * @returns Query options for use with useQuery or prefetchQuery
 *
 * @example
 * ```typescript
 * // In hook
 * return useQuery(experiencesQuery(workspaceId, filters))
 *
 * // In loader
 * await context.queryClient.ensureQueryData(experiencesQuery(workspaceId))
 * ```
 */
export const experiencesQuery = (
  workspaceId: string,
  filters?: { profile?: ExperienceProfile },
) =>
  queryOptions({
    queryKey: experienceKeys.list(workspaceId, filters),
    queryFn: async (): Promise<Experience[]> => {
      const experiencesRef = collection(
        firestore,
        `workspaces/${workspaceId}/experiences`,
      )

      // Build query with status filter and optional profile filter
      let q = query(
        experiencesRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
      )

      if (filters?.profile) {
        q = query(
          experiencesRef,
          where('status', '==', 'active'),
          where('profile', '==', filters.profile),
          orderBy('createdAt', 'desc'),
        )
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map((docSnapshot) =>
        convertFirestoreDoc(docSnapshot, experienceSchema),
      )
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

/**
 * Query options for fetching a single experience
 *
 * Note: staleTime=Infinity because data is kept fresh by onSnapshot listener in hooks
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns Query options for use with useQuery or prefetchQuery
 *
 * @example
 * ```typescript
 * // In hook
 * return useQuery(experienceQuery(workspaceId, experienceId))
 *
 * // In loader
 * const exp = await context.queryClient.ensureQueryData(
 *   experienceQuery(workspaceId, experienceId)
 * )
 * ```
 */
export const experienceQuery = (workspaceId: string, experienceId: string) =>
  queryOptions({
    queryKey: experienceKeys.detail(workspaceId, experienceId),
    queryFn: async (): Promise<Experience | null> => {
      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences/${experienceId}`,
      )

      const snapshot = await getDoc(experienceRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, experienceSchema)
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
