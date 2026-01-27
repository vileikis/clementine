/**
 * Generic Hook: useUpdateEventConfig
 *
 * Mutation hook for updating event config fields using dot notation.
 * Wraps updateEventConfigField helper with TanStack Query for reactivity.
 *
 * Benefits:
 * - Atomic Firestore updates (no race conditions)
 * - Automatic query invalidation (triggers re-render)
 * - Error handling with Sentry
 * - Supports partial updates (single or multiple fields)
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation
 *
 * @example
 * ```tsx
 * const updateConfig = useUpdateEventConfig(projectId, eventId)
 *
 * // Update single field
 * await updateConfig.mutateAsync({
 *   'sharing.download': false
 * })
 *
 * // Update multiple fields atomically
 * await updateConfig.mutateAsync({
 *   'sharing.download': false,
 *   'sharing.instagram': true,
 *   'sharing.facebook': true
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { updateEventConfigField } from '../lib/updateEventConfigField'

/**
 * Hook for updating event configuration with dot notation
 */
export function useUpdateEventConfig(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      await updateEventConfigField(projectId, eventId, updates)
    },

    // Success: invalidate queries to trigger re-fetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-event', projectId, eventId],
      })
    },

    // Error: report to Sentry
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'event/shared',
          action: 'update-event-config',
        },
        extra: {
          errorType: 'event-config-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })
}
