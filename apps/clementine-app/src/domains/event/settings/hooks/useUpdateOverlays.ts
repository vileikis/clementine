/**
 * Domain-Specific Hook: useUpdateOverlays
 *
 * Specialized mutation hook for updating event overlay configuration.
 * Wraps updateEventConfigField with domain-specific error tracking.
 *
 * Why a separate hook?
 * - Better error tracking (Sentry tags: "update-overlays")
 * - Domain-specific semantics (clear intent)
 * - Type safety for overlay fields
 * - Easier debugging and monitoring
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation for overlay updates
 *
 * @example
 * ```tsx
 * const updateOverlays = useUpdateOverlays(projectId, eventId)
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
import { prefixKeys, updateEventConfigField } from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'

/**
 * Hook for updating event overlays with domain-specific tracking
 */
export function useUpdateOverlays(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (updates: UpdateOverlaysConfig) => {
      // Validate partial overlay updates
      const validated = updateOverlaysConfigSchema.parse(updates)

      // Transform to dot notation with 'overlays.' prefix
      const dotNotationUpdates = prefixKeys(validated, 'overlays')

      // Use shared helper for atomic Firestore update
      await updateEventConfigField(projectId, eventId, dotNotationUpdates)
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // Error: report to Sentry for debugging
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/settings',
          action: 'update-overlays',
        },
        extra: {
          errorType: 'overlays-config-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}
