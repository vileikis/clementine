/**
 * Domain-Specific Hook: useUpdateShare
 *
 * Specialized mutation hook for updating event share screen configuration.
 * Pushes the complete share object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @param eventId - Event ID
 * @returns TanStack Query mutation for share updates
 *
 * @example
 * ```tsx
 * const updateShare = useUpdateShare(projectId, eventId)
 *
 * // Update entire share config
 * await updateShare.mutateAsync({
 *   title: 'Your photo is ready!',
 *   description: 'Download or share your creation',
 *   cta: { label: 'Visit Website', url: 'https://example.com' }
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { ShareConfig } from '@/domains/event/shared/schemas'
import {
  shareWriteSchema,
  updateEventConfigField,
} from '@/domains/event/shared'
import { useTrackedMutation } from '@/domains/event/designer'

/**
 * Hook for updating event share config with domain-specific tracking
 */
export function useUpdateShare(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (share: ShareConfig) => {
      // Validate with write schema (stricter than read schema)
      const validated = shareWriteSchema.parse(share)

      // Push entire share object (atomic replacement)
      await updateEventConfigField(projectId, eventId, { share: validated })
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
          domain: 'event/share',
          action: 'update-share',
        },
        extra: {
          errorType: 'share-update-failure',
          projectId,
          eventId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}
