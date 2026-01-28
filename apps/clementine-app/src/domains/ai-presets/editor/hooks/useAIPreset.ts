/**
 * useAIPreset Hook
 *
 * Real-time subscription to a single AI preset.
 * Uses Firestore onSnapshot for real-time updates with TanStack Query cache integration.
 *
 * Pattern: Combines Firebase onSnapshot (real-time) with TanStack Query (caching)
 * Reference: Follows same pattern as useWorkspaceExperience hook
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { aiPresetSchema } from '@clementine/shared'
import { aiPresetKeys, aiPresetQuery } from '../queries/ai-preset.query'
import type { AIPreset } from '@clementine/shared'

import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Hook to fetch a single AI preset with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Returns null if document doesn't exist (no error thrown)
 *
 * Data Flow:
 * 1. Route loader can call ensureQueryData() → Warms cache with initial data
 * 2. Component calls useAIPreset() → Returns cached data immediately
 * 3. onSnapshot listener updates cache → Component re-renders with new data
 *
 * @param workspaceId - Workspace containing the preset
 * @param presetId - AI preset document ID
 * @returns TanStack Query result with preset or null
 *
 * @example
 * ```tsx
 * function PresetEditor({ workspaceId, presetId }) {
 *   const { data: preset, isLoading } = useAIPreset(workspaceId, presetId)
 *
 *   if (isLoading) return <Skeleton />
 *   if (!preset) return <NotFound />
 *
 *   return <EditorForm preset={preset} />
 * }
 * ```
 */
export function useAIPreset(workspaceId: string, presetId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    if (!workspaceId || !presetId) return

    const presetRef = doc(
      firestore,
      `workspaces/${workspaceId}/aiPresets/${presetId}`,
    )

    const unsubscribe = onSnapshot(presetRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<AIPreset | null>(
          aiPresetKeys.detail(workspaceId, presetId),
          null,
        )
        return
      }

      const preset = convertFirestoreDoc(snapshot, aiPresetSchema)
      queryClient.setQueryData<AIPreset>(
        aiPresetKeys.detail(workspaceId, presetId),
        preset,
      )
    })

    return () => unsubscribe()
  }, [workspaceId, presetId, queryClient])

  return useQuery(aiPresetQuery(workspaceId, presetId))
}
