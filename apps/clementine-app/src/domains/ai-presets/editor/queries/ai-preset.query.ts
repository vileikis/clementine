/**
 * AI Preset Query Options Factories
 *
 * TanStack Query options factories for AI preset data fetching.
 * Used in route loaders and components for consistent query configuration.
 *
 * Pattern: Query options factory following TanStack Query best practices
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { aiPresetSchema } from '@clementine/shared'
import type { AIPreset } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query key factory for AI preset editor
 *
 * Provides consistent, hierarchical query keys for cache management.
 */
export const aiPresetKeys = {
  /** Base key for all AI preset queries */
  all: ['aiPresets'] as const,

  /** Key for preset details */
  details: () => [...aiPresetKeys.all, 'detail'] as const,

  /** Key for specific preset detail */
  detail: (workspaceId: string, presetId: string) =>
    [...aiPresetKeys.details(), workspaceId, presetId] as const,
}

/**
 * Query options for fetching a single AI preset
 *
 * Note: staleTime=Infinity because data is kept fresh by onSnapshot listener in hooks
 *
 * @param workspaceId - Workspace containing the preset
 * @param presetId - AI preset document ID
 * @returns Query options for use with useQuery or prefetchQuery
 *
 * @example
 * ```typescript
 * // In hook
 * return useQuery(aiPresetQuery(workspaceId, presetId))
 *
 * // In loader
 * const preset = await context.queryClient.ensureQueryData(
 *   aiPresetQuery(workspaceId, presetId)
 * )
 * ```
 */
export const aiPresetQuery = (workspaceId: string, presetId: string) =>
  queryOptions({
    queryKey: aiPresetKeys.detail(workspaceId, presetId),
    queryFn: async (): Promise<AIPreset | null> => {
      const presetRef = doc(
        firestore,
        `workspaces/${workspaceId}/aiPresets/${presetId}`,
      )

      const snapshot = await getDoc(presetRef)

      if (!snapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(snapshot, aiPresetSchema)
    },
    enabled: !!workspaceId && !!presetId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
