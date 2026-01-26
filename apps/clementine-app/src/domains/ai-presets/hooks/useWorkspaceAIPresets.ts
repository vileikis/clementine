/**
 * useWorkspaceAIPresets Hook
 *
 * Real-time subscription to AI presets list for a workspace.
 * Uses Firestore onSnapshot for real-time updates with TanStack Query cache integration.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { aiPresetSchema } from '@clementine/shared'
import type { AIPreset } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * List workspace AI presets with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Proper Firestore type conversion (Timestamps → numbers)
 * - TanStack Query cache integration
 * - Reusable across components
 *
 * @param workspaceId - Workspace ID (determines sub-collection path)
 * @returns TanStack Query result with real-time preset list
 *
 * @example
 * ```tsx
 * const { data: presets, isLoading, error } = useWorkspaceAIPresets(workspaceId)
 * ```
 */
export function useWorkspaceAIPresets(workspaceId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for presets
  useEffect(() => {
    if (!workspaceId) return

    const presetsQuery = query(
      collection(firestore, `workspaces/${workspaceId}/aiPresets`),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(presetsQuery, (snapshot) => {
      const presets = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, aiPresetSchema),
      )

      queryClient.setQueryData<AIPreset[]>(['aiPresets', workspaceId], presets)
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, queryClient])

  return useQuery<AIPreset[]>({
    queryKey: ['aiPresets', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const presetsQuery = query(
        collection(firestore, `workspaces/${workspaceId}/aiPresets`),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
      )

      const presetsSnapshot = await getDocs(presetsQuery)

      return presetsSnapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, aiPresetSchema),
      )
    },
    enabled: !!workspaceId,
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
