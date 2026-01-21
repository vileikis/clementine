/**
 * useExperiencesForSlot Hook
 *
 * Fetches experiences filtered by slot-compatible profiles.
 * Independent implementation for event domain with real-time updates.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 */
import { useEffect } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { SLOT_PROFILES } from '../constants'
import type { SlotType } from '../constants'
import type { Experience } from '@/domains/experience/shared/schemas'
import { experienceSchema } from '@/domains/experience/shared/schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query key factory for slot experiences
 */
export const slotExperiencesKeys = {
  all: ['experiences', 'slot'] as const,
  list: (workspaceId: string, slot: SlotType) =>
    [...slotExperiencesKeys.all, workspaceId, slot] as const,
}

/**
 * Query options for fetching experiences filtered by slot compatibility
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param slot - Slot type determines allowed profiles
 * @returns Query options for use with useQuery
 */
export const slotExperiencesQuery = (workspaceId: string, slot: SlotType) =>
  queryOptions({
    queryKey: slotExperiencesKeys.list(workspaceId, slot),
    queryFn: async (): Promise<Experience[]> => {
      const experiencesRef = collection(
        firestore,
        `workspaces/${workspaceId}/experiences`,
      )

      const allowedProfiles = SLOT_PROFILES[slot]

      // Query with profile IN filter for slot compatibility
      const q = query(
        experiencesRef,
        where('status', '==', 'active'),
        where('profile', 'in', allowedProfiles),
        orderBy('createdAt', 'desc'),
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((docSnapshot) =>
        convertFirestoreDoc(docSnapshot, experienceSchema),
      )
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

/**
 * Hook to fetch slot-compatible experiences with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Filters to status === 'active' (excludes soft-deleted)
 * - Profile filtering based on slot compatibility
 * - Sorted by createdAt descending (newest first)
 *
 * Implementation:
 * - Uses direct Firestore queries with `where('profile', 'in', [...])`
 * - Includes real-time updates via onSnapshot listener
 * - Independent from useWorkspaceExperiences (event domain specific)
 * - Search filtering is NOT included (handled in ConnectExperienceDrawer)
 *
 * @param workspaceId - Workspace to fetch experiences from
 * @param slot - Slot type determines allowed profiles
 * @returns TanStack Query result with filtered experiences
 *
 * @example
 * ```tsx
 * function ConnectExperienceDrawer({ workspaceId, slot }) {
 *   const { data: experiences, isLoading } = useExperiencesForSlot(workspaceId, slot)
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return experiences.map(exp => <ExperienceItem key={exp.id} experience={exp} />)
 * }
 * ```
 */
export function useExperiencesForSlot(workspaceId: string, slot: SlotType) {
  const queryClient = useQueryClient()
  const allowedProfiles = SLOT_PROFILES[slot]

  // Set up real-time listener
  useEffect(() => {
    // Guard: Skip Firestore operations if workspaceId is empty
    if (!workspaceId) {
      return
    }

    const experiencesRef = collection(
      firestore,
      `workspaces/${workspaceId}/experiences`,
    )

    // Query with profile IN filter for slot compatibility
    const q = query(
      experiencesRef,
      where('status', '==', 'active'),
      where('profile', 'in', allowedProfiles),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map((docSnapshot) =>
        convertFirestoreDoc(docSnapshot, experienceSchema),
      )
      queryClient.setQueryData<Experience[]>(
        slotExperiencesKeys.list(workspaceId, slot),
        experiences,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, slot, allowedProfiles, queryClient])

  return useQuery(slotExperiencesQuery(workspaceId, slot))
}
