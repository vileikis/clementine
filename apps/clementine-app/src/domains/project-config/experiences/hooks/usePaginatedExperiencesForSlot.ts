/**
 * usePaginatedExperiencesForSlot Hook
 *
 * Fetches experiences filtered by slot-compatible profiles using cursor-based
 * pagination. Uses TanStack Query's useInfiniteQuery with Firestore startAfter + limit.
 */
import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { SLOT_PROFILES } from '../constants'
import type { DocumentSnapshot } from 'firebase/firestore'

import type { SlotType } from '../constants'
import { experienceSchema } from '@/domains/experience/shared/schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

const DEFAULT_PAGE_SIZE = 20

/**
 * Query key factory for paginated slot experiences
 */
export const paginatedSlotExperiencesKeys = {
  all: ['experiences', 'slot', 'paginated'] as const,
  list: (workspaceId: string, slot: SlotType) =>
    [...paginatedSlotExperiencesKeys.all, workspaceId, slot] as const,
}

export interface UsePaginatedExperiencesForSlotOptions {
  /** Number of experiences to load per page. Default: 20 */
  pageSize?: number
}

/**
 * Hook to fetch slot-compatible experiences with cursor-based pagination.
 *
 * Returns the full useInfiniteQuery result spread with an additional
 * `experiences` convenience property (flattened across all loaded pages).
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param slot - Slot type determines allowed profiles
 * @param options - Pagination options (pageSize)
 * @returns useInfiniteQuery result + flattened `experiences` array
 */
export function usePaginatedExperiencesForSlot(
  workspaceId: string | undefined,
  slot: SlotType,
  options?: UsePaginatedExperiencesForSlotOptions,
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE

  const infiniteQuery = useInfiniteQuery({
    queryKey: paginatedSlotExperiencesKeys.list(workspaceId ?? '', slot),
    queryFn: async ({ pageParam }) => {
      const experiencesRef = collection(
        firestore,
        `workspaces/${workspaceId}/experiences`,
      )

      const allowedProfiles = SLOT_PROFILES[slot]

      const constraints = [
        where('status', '==', 'active'),
        where('profile', 'in', allowedProfiles),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
        ...(pageParam ? [startAfter(pageParam)] : []),
      ]

      const q = query(experiencesRef, ...constraints)
      const snapshot = await getDocs(q)

      const experiences = snapshot.docs.map((docSnapshot) =>
        convertFirestoreDoc(docSnapshot, experienceSchema),
      )

      const lastDoc =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null

      return { experiences, lastDoc }
    },
    initialPageParam: null as DocumentSnapshot | null,
    getNextPageParam: (lastPage) =>
      lastPage.experiences.length === pageSize ? lastPage.lastDoc : undefined,
    enabled: !!workspaceId,
  })

  const experiences = useMemo(
    () =>
      infiniteQuery.data?.pages.flatMap((page) => page.experiences) ?? [],
    [infiniteQuery.data],
  )

  return { ...infiniteQuery, experiences }
}
