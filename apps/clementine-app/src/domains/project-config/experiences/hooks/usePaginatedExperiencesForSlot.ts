/**
 * usePaginatedExperiencesForSlot Hook
 *
 * Fetches experiences filtered by slot-compatible profiles using cursor-based
 * pagination. Uses TanStack Query's useInfiniteQuery with Firestore startAfter + limit.
 */
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
import type { Experience } from '@/domains/experience/shared/schemas'
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

export interface UsePaginatedExperiencesForSlotResult {
  /** All loaded experiences (flattened across pages) */
  experiences: Experience[]
  /** True during initial load */
  isLoading: boolean
  /** True while fetching the next page */
  isFetchingNextPage: boolean
  /** True if more pages are available */
  hasNextPage: boolean
  /** Trigger loading the next page */
  fetchNextPage: () => void
}

/**
 * Hook to fetch slot-compatible experiences with cursor-based pagination.
 *
 * Uses Firestore startAfter + limit for efficient page-by-page loading.
 * Returns a flattened array of all loaded experiences across pages.
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param slot - Slot type determines allowed profiles
 * @param options - Pagination options (pageSize)
 * @returns Paginated result with experiences array and pagination controls
 */
export function usePaginatedExperiencesForSlot(
  workspaceId: string | undefined,
  slot: SlotType,
  options?: UsePaginatedExperiencesForSlotOptions,
): UsePaginatedExperiencesForSlotResult {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
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

  return {
    experiences: data?.pages.flatMap((page) => page.experiences) ?? [],
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
  }
}
