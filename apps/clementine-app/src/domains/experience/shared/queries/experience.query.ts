/**
 * Experience Query Options Factories
 *
 * TanStack Query options factories for experience data fetching.
 * Used in route loaders and components for consistent query configuration.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { experienceSchema } from '../schemas/experience.schema'
import type { QueryOptions } from '@tanstack/react-query'

import type {
  Experience,
  ExperienceProfile,
} from '../schemas/experience.schema'
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
 * @param workspaceId - Workspace to fetch experiences from
 * @param filters - Optional filters (profile type)
 * @returns QueryOptions for use with useQuery or prefetchQuery
 */
export function experiencesQuery(
  workspaceId: string,
  filters?: { profile?: ExperienceProfile },
): QueryOptions<Experience[]> {
  return {
    queryKey: experienceKeys.list(workspaceId, filters),
    queryFn: async () => {
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
  }
}

/**
 * Query options for fetching a single experience
 *
 * @param workspaceId - Workspace containing the experience
 * @param experienceId - Experience document ID
 * @returns QueryOptions for use with useQuery or prefetchQuery
 */
export function experienceQuery(
  workspaceId: string,
  experienceId: string,
): QueryOptions<Experience | null> {
  return {
    queryKey: experienceKeys.detail(workspaceId, experienceId),
    queryFn: async () => {
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
  }
}
