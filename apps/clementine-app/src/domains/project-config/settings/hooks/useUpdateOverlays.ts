/**
 * Domain-Specific Hook: useUpdateOverlays
 *
 * Specialized mutation hook for updating project overlay configuration.
 * Wraps updateProjectConfigField with domain-specific error tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-overlays")
 * - Domain-specific semantics (clear intent)
 * - Type safety for overlay fields
 * - Easier debugging and monitoring
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for overlay updates
 *
 * @example
 * ```tsx
 * const updateOverlays = useUpdateOverlays(projectId)
 *
 * // Update single overlay (doesn't affect other overlays)
 * await updateOverlays.mutateAsync({
 *   '1:1': { mediaAssetId: 'abc', url: 'https://...' }
 * })
 *
 * // Update multiple overlays atomically
 * await updateOverlays.mutateAsync({
 *   '1:1': { mediaAssetId: 'abc', url: 'https://...' },
 *   '9:16': { mediaAssetId: 'xyz', url: 'https://...' }
 * })
 *
 * // Remove an overlay
 * await updateOverlays.mutateAsync({
 *   '1:1': null
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateOverlaysConfigSchema } from '../schemas'
import type { UpdateOverlaysConfig } from '../schemas'
import {
  prefixKeys,
  updateProjectConfigField,
} from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project overlays with domain-specific tracking
 */
export function useUpdateOverlays(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // Validate partial overlay updates
      const validated = updateOverlaysConfigSchema.parse(updates)

      // Transform to dot notation with 'overlays.' prefix
      const dotNotationUpdates = prefixKeys(validated, 'overlays')

      // Use shared helper for atomic Firestore update
      await updateProjectConfigField(projectId, dotNotationUpdates)
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project-config/settings',
          action: 'update-overlays',
        },
        extra: {
          errorType: 'overlays-config-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}
