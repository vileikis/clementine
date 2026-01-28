/**
 * Domain-Specific Hook: useUpdateShareReady
 *
 * Specialized mutation hook for updating project share ready state configuration.
 * Pushes the complete shareReady object to Firestore (atomic replacement).
 *
 * @param projectId - Project ID
 * @returns TanStack Query mutation for share ready updates
 *
 * @example
 * ```tsx
 * const updateShareReady = useUpdateShareReady(projectId)
 *
 * // Update entire share ready config
 * await updateShareReady.mutateAsync({
 *   title: 'Your photo is ready!',
 *   description: 'Download or share your creation',
 *   cta: { label: 'Visit Website', url: 'https://example.com' }
 * })
 * ```
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import type { ShareReadyConfig } from '@clementine/shared'
import {
  shareWriteSchema,
  updateProjectConfigField,
} from '@/domains/project-config/shared'
import { useTrackedMutation } from '@/domains/project-config/designer'

/**
 * Hook for updating project share ready config with domain-specific tracking
 */
export function useUpdateShareReady(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (shareReady: ShareReadyConfig) => {
      // Validate with write schema (stricter than read schema)
      const validated = shareWriteSchema.parse(shareReady)

      // Push entire shareReady object (atomic replacement)
      await updateProjectConfigField(projectId, { shareReady: validated })
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
          domain: 'project-config/share',
          action: 'update-share-ready',
        },
        extra: {
          errorType: 'share-ready-update-failure',
          projectId,
        },
      })
    },
  })

  return useTrackedMutation(mutation)
}
